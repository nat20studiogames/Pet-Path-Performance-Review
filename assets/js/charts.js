/* ============================================================================
   Pet Escape — Performance Review · chart builders
   ----------------------------------------------------------------------------
   Hand-rolled inline SVG. No charting library, no CDN, no build step.

   Colours are emitted as `style="fill:var(--token)"` rather than baked-in hex,
   because CSS custom properties are not resolved inside SVG *presentation
   attributes* (fill="var(--x)" silently fails) but are resolved inside the
   `style` attribute. Doing it this way means every chart recolours itself when
   the theme flips, with no redraw.
   ========================================================================== */

var Charts = (function () {
  'use strict';

  /* -- Token lookup --------------------------------------------------------- */
  var MEMBER_TOKEN = {
    'Phú': '--c-phu',
    'Phong': '--c-phong',
    'Hiếu': '--c-hieu',
    'Dương': '--c-duong',
    'Team': '--c-team'
  };

  var IMPACT_TOKEN = {
    'Critical': '--i-critical',
    'High': '--i-high',
    'Medium': '--i-medium',
    'Low': '--i-low'
  };

  var SIZE_TOKEN = {
    'Large': '--s-large',
    'Medium': '--s-medium',
    'Small': '--s-small'
  };

  function v(token) { return 'var(' + token + ')'; }
  function memberColor(name) { return v(MEMBER_TOKEN[name] || '--c-team'); }
  function impactColor(level) { return v(IMPACT_TOKEN[level] || '--s-medium'); }
  function sizeColor(level) { return v(SIZE_TOKEN[level] || '--s-medium'); }

  /* Escape text destined for markup. Task names here contain `&`. */
  function esc(s) {
    return String(s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function svgOpen(w, h, label) {
    return '<svg class="chart" viewBox="0 0 ' + w + ' ' + h + '" ' +
           'preserveAspectRatio="xMinYMin meet" role="img" ' +
           'aria-label="' + esc(label) + '" style="height:auto">' +
           '<title>' + esc(label) + '</title>';
  }

  /* ==========================================================================
     Horizontal bar chart. Label column, bar, value at the end.
     data: [{ label, value, color }]
     ======================================================================== */
  function hbar(data, opts) {
    opts = opts || {};
    var labelW = opts.labelW || 104;
    var rowH   = opts.rowH   || 32;
    var gap    = opts.gap    || 8;
    var valW   = 34;
    var W      = opts.width  || 460;
    var H      = data.length * rowH;
    var plotW  = W - labelW - valW;

    var max = opts.max || Math.max.apply(null, data.map(function (d) { return d.value; }));
    if (!max) max = 1;

    var out = svgOpen(W, H, opts.label || 'Bar chart');

    data.forEach(function (d, i) {
      var y  = i * rowH;
      var bh = rowH - gap;
      var bw = Math.max(d.value > 0 ? 2 : 0, (d.value / max) * plotW);
      var fill = d.color || v('--accent');

      out += '<g data-hoverable>';
      out += '<title>' + esc(d.label + ': ' + d.value + ' ' +
             (d.value === 1 ? 'task' : 'tasks')) + '</title>';
      /* Label */
      out += '<text class="lbl" x="0" y="' + (y + bh / 2) + '" ' +
             'dominant-baseline="central">' + esc(d.label) + '</text>';
      /* Track */
      out += '<rect x="' + labelW + '" y="' + y + '" width="' + plotW + '" height="' + bh +
             '" rx="4" style="fill:var(--surface-2)"/>';
      /* Bar */
      if (bw > 0) {
        out += '<rect class="bar" x="' + labelW + '" y="' + y + '" width="' + bw +
               '" height="' + bh + '" rx="4" style="fill:' + fill + '"/>';
      }
      /* Value */
      out += '<text class="val" x="' + W + '" y="' + (y + bh / 2) +
             '" text-anchor="end" dominant-baseline="central">' + d.value + '</text>';
      out += '</g>';
    });

    return out + '</svg>';
  }

  /* ==========================================================================
     Single segmented bar — a distribution shown as one 100%-wide strip.
     data: [{ label, value, color }]
     ======================================================================== */
  function segbar(data, opts) {
    opts = opts || {};
    var W = opts.width || 460;
    var barH = opts.barH || 44;
    var H = barH + 2;
    var total = data.reduce(function (a, d) { return a + d.value; }, 0) || 1;

    var out = svgOpen(W, H, opts.label || 'Distribution');
    var x = 0;

    data.forEach(function (d, i) {
      if (!d.value) return;
      var w = (d.value / total) * W;
      var fill = d.color || v('--accent');
      var first = x === 0;
      var last  = Math.abs(x + w - W) < 0.6;
      /* Rounded only on the outer ends, so the strip reads as one object */
      var r = 5;
      var path = roundedSide(x, 1, w, barH, r, first, last);

      out += '<g data-hoverable><title>' + esc(d.label + ': ' + d.value + ' of ' +
             total + ' tasks (' + Math.round((d.value / total) * 100) + '%)') + '</title>';
      out += '<path class="bar" d="' + path + '" style="fill:' + fill + '"/>';

      /* Only label the segment inline if it is wide enough to hold the text */
      if (w > 42) {
        out += '<text class="val-in" x="' + (x + w / 2) + '" y="' + (1 + barH / 2) +
               '" text-anchor="middle" dominant-baseline="central">' + d.value + '</text>';
      }
      out += '</g>';
      x += w;
    });

    return out + '</svg>';
  }

  /* Rectangle path with rounded corners on the left and/or right side only. */
  function roundedSide(x, y, w, h, r, roundLeft, roundRight) {
    r = Math.min(r, w / 2, h / 2);
    var rl = roundLeft ? r : 0;
    var rr = roundRight ? r : 0;
    return 'M' + (x + rl) + ',' + y +
           'H' + (x + w - rr) +
           (rr ? 'a' + rr + ',' + rr + ' 0 0 1 ' + rr + ',' + rr : '') +
           'V' + (y + h - rr) +
           (rr ? 'a' + rr + ',' + rr + ' 0 0 1 ' + (-rr) + ',' + rr : '') +
           'H' + (x + rl) +
           (rl ? 'a' + rl + ',' + rl + ' 0 0 1 ' + (-rl) + ',' + (-rl) : '') +
           'V' + (y + rl) +
           (rl ? 'a' + rl + ',' + rl + ' 0 0 1 ' + rl + ',' + (-rl) : '') + 'Z';
  }

  /* ==========================================================================
     Grouped bars: one group per member, one bar per category.
     rows: [{ label, cells: [{ label, value }] }]
     ======================================================================== */
  function groupedBars(rows, opts) {
    opts = opts || {};
    var W = opts.width || 520;
    var groupH = opts.groupH || 74;
    var labelW = 62;
    var H = rows.length * groupH;
    var plotW = W - labelW - 26;
    var max = 0;
    rows.forEach(function (r) {
      r.cells.forEach(function (c) { if (c.value > max) max = c.value; });
    });
    if (!max) max = 1;

    var out = svgOpen(W, H, opts.label || 'Grouped bars');

    rows.forEach(function (row, gi) {
      var gy = gi * groupH;
      var active = row.cells.filter(function (c) { return c.value > 0; });
      var barH = 11;
      var step = barH + 4;
      var blockH = active.length * step - 4;
      var top = gy + (groupH - blockH) / 2;

      out += '<text class="lbl" x="0" y="' + (gy + groupH / 2) +
             '" dominant-baseline="central" style="fill:' + memberColor(row.label) +
             ';font-weight:680">' + esc(row.label) + '</text>';

      active.forEach(function (c, i) {
        var y = top + i * step;
        var bw = Math.max(2, (c.value / max) * plotW);
        out += '<g data-hoverable><title>' + esc(row.label + ' · ' + c.label + ': ' +
               c.value + (c.value === 1 ? ' task' : ' tasks')) + '</title>';
        out += '<rect class="bar" x="' + labelW + '" y="' + y + '" width="' + bw +
               '" height="' + barH + '" rx="3" style="fill:' + memberColor(row.label) + '"/>';
        out += '<text class="lbl-sm" x="' + (labelW + bw + 7) + '" y="' + (y + barH / 2) +
               '" dominant-baseline="central">' + esc(c.label) + ' ' + c.value + '</text>';
        out += '</g>';
      });

      if (gi < rows.length - 1) {
        out += '<line class="axis" x1="0" y1="' + (gy + groupH) + '" x2="' + W +
               '" y2="' + (gy + groupH) + '"/>';
      }
    });

    return out + '</svg>';
  }

  /* ==========================================================================
     Donut. data: [{ label, value, color }]
     ======================================================================== */
  function donut(data, opts) {
    opts = opts || {};
    var size = opts.size || 280;
    var cx = size / 2, cy = size / 2;
    var outer = opts.outer || size / 2 - 4;
    var inner = opts.inner || outer * 0.6;
    var total = data.reduce(function (a, d) { return a + d.value; }, 0) || 1;
    var pad = opts.pad === undefined ? 1.2 : opts.pad; /* degrees between slices */

    var out = svgOpen(size, size, opts.label || 'Donut chart');
    var angle = -90;

    data.forEach(function (d) {
      if (!d.value) return;
      var sweep = (d.value / total) * 360;
      var a0 = angle + pad / 2;
      var a1 = angle + sweep - pad / 2;
      if (a1 <= a0) { a1 = a0 + 0.1; }

      out += '<g data-hoverable><title>' + esc(d.label + ': ' + d.value + '%') + '</title>';
      out += '<path class="bar" d="' + annulusPath(cx, cy, inner, outer, a0, a1) +
             '" style="fill:' + (d.color || v('--accent')) + '"/>';
      out += '</g>';
      angle += sweep;
    });

    /* Centre caption */
    if (opts.centerTop || opts.centerMain || opts.centerSub) {
      if (opts.centerTop) {
        out += '<text x="' + cx + '" y="' + (cy - 20) + '" text-anchor="middle" ' +
               'style="font-size:10px;font-weight:700;letter-spacing:.1em;' +
               'text-transform:uppercase;fill:var(--text-3)">' + esc(opts.centerTop) + '</text>';
      }
      if (opts.centerMain) {
        out += '<text x="' + cx + '" y="' + (cy + 3) + '" text-anchor="middle" ' +
               'style="font-size:30px;font-weight:700;letter-spacing:-.03em;' +
               'fill:var(--text)">' + esc(opts.centerMain) + '</text>';
      }
      if (opts.centerSub) {
        out += '<text x="' + cx + '" y="' + (cy + 24) + '" text-anchor="middle" ' +
               'style="font-size:11px;fill:var(--text-3)">' + esc(opts.centerSub) + '</text>';
      }
    }

    /* Slice labels placed on the ring itself */
    if (opts.sliceLabels) {
      angle = -90;
      var mid = (inner + outer) / 2;
      data.forEach(function (d) {
        if (!d.value) return;
        var sweep = (d.value / total) * 360;
        if (sweep > 26) {
          var p = polar(cx, cy, mid, angle + sweep / 2);
          out += '<text x="' + p.x.toFixed(1) + '" y="' + p.y.toFixed(1) + '" ' +
                 'text-anchor="middle" dominant-baseline="central" ' +
                 'style="font-size:13px;font-weight:720;fill:#fff;' +
                 'paint-order:stroke;stroke:rgba(0,0,0,.22);stroke-width:2.5px">' +
                 d.value + '%</text>';
        }
        angle += sweep;
      });
    }

    return out + '</svg>';
  }

  function polar(cx, cy, r, deg) {
    var rad = deg * Math.PI / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }

  function annulusPath(cx, cy, ri, ro, a0, a1) {
    var large = (a1 - a0) > 180 ? 1 : 0;
    var o0 = polar(cx, cy, ro, a0), o1 = polar(cx, cy, ro, a1);
    var i1 = polar(cx, cy, ri, a1), i0 = polar(cx, cy, ri, a0);
    return 'M' + o0.x.toFixed(2) + ',' + o0.y.toFixed(2) +
           'A' + ro + ',' + ro + ' 0 ' + large + ' 1 ' + o1.x.toFixed(2) + ',' + o1.y.toFixed(2) +
           'L' + i1.x.toFixed(2) + ',' + i1.y.toFixed(2) +
           'A' + ri + ',' + ri + ' 0 ' + large + ' 0 ' + i0.x.toFixed(2) + ',' + i0.y.toFixed(2) + 'Z';
  }

  return {
    hbar: hbar,
    segbar: segbar,
    groupedBars: groupedBars,
    donut: donut,
    memberColor: memberColor,
    impactColor: impactColor,
    sizeColor: sizeColor,
    esc: esc
  };
})();
