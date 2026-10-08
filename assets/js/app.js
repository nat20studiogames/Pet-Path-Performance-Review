/* ============================================================================
   Pet Escape — Performance Review · page assembly
   ----------------------------------------------------------------------------
   Reads window.REVIEW (data.js), renders every section, and wires the
   register's filters/sorting plus the theme toggle.
   ========================================================================== */

(function () {
  'use strict';

  var D = window.REVIEW;
  var S = D.stats;
  var C = Charts;
  var esc = C.esc;

  function $(sel) { return document.querySelector(sel); }
  function set(sel, html) { var el = $(sel); if (el) el.innerHTML = html; }
  function plural(n, one, many) { return n === 1 ? one : many; }

  /* Member lookup by display name */
  var byName = {};
  D.members.forEach(function (m) { byName[m.name] = m; });

  function memberChip(name) {
    if (!name) return '<span style="color:var(--text-3)">—</span>';
    return '<span class="chip chip-m" data-m="' + esc(name) + '">' +
           '<span class="swatch"></span>' + esc(name) + '</span>';
  }
  function impactChip(level) {
    return '<span class="chip chip-impact-' + level.toLowerCase() + '">' + esc(level) + '</span>';
  }
  function sizeChip(level) {
    return '<span class="chip chip-size chip-size-' + level.toLowerCase() + '">' + esc(level) + '</span>';
  }

  /* ==========================================================================
     1 · Masthead stats
     ======================================================================== */
  function renderStats() {
    var items = [
      { n: S.total,         l: 'Tasks reviewed' },
      { n: S.categories,    l: 'Work streams' },
      { n: S.members,       l: 'Team members' },
      { n: S.critical,      l: 'Critical tasks' },
      { n: S.collaborative, l: 'Shared tasks' }
    ];
    set('#stat-strip', items.map(function (i) {
      return '<div class="stat"><span class="n">' + i.n + '</span>' +
             '<span class="l">' + esc(i.l) + '</span></div>';
    }).join(''));
  }

  /* ==========================================================================
     2 · The team
     ======================================================================== */
  function renderPeople() {
    var owned = {};
    S.byOwner.forEach(function (o) { owned[o.label] = o.value; });

    set('#people', D.members.filter(function (m) { return !m.collective; })
      .map(function (m) {
        var n = owned[m.name] || 0;
        return '<article class="person" data-m="' + esc(m.name) + '">' +
          '<div class="who"><span class="nm">' + esc(m.name) + '</span>' +
          '<span class="rl">' + esc(m.role) + '</span></div>' +
          '<p class="bl">' + esc(m.blurb) + '</p>' +
          '<div class="owned"><b>' + n + '</b>' +
          '<span>' + plural(n, 'task owned', 'tasks owned') + '</span></div>' +
          '</article>';
      }).join(''));
  }

  /* ==========================================================================
     3 · Project composition
     ======================================================================== */
  function renderComposition() {
    /* Category mix */
    set('#chart-category', C.hbar(S.byCategory.map(function (d) {
      return {
        label: d.label,
        value: d.value,
        color: d.label === 'Code' ? 'var(--accent)' : 'var(--s-medium)'
      };
    }), { label: 'Tasks by work stream', width: 460, rowH: 34, labelW: 94 }));

    /* Impact distribution */
    set('#chart-impact', C.segbar(S.byImpact.map(function (d) {
      return { label: d.label, value: d.value, color: C.impactColor(d.label) };
    }), { label: 'Tasks by impact rating', width: 460 }));

    set('#legend-impact', D.order.impact.map(function (k) {
      var row = S.byImpact.filter(function (d) { return d.label === k; })[0];
      return '<span class="legend-item"><span class="k" style="background:' +
             C.impactColor(k) + '"></span>' + esc(k) + ' <b style="color:var(--text)">' +
             row.value + '</b></span>';
    }).join(''));

    /* Size distribution */
    set('#chart-size', C.segbar(S.bySize.map(function (d) {
      return { label: d.label, value: d.value, color: C.sizeColor(d.label) };
    }), { label: 'Tasks by size', width: 460 }));

    set('#legend-size', D.order.size.map(function (k) {
      var row = S.bySize.filter(function (d) { return d.label === k; })[0];
      return '<span class="legend-item"><span class="k" style="background:' +
             C.sizeColor(k) + '"></span>' + esc(k) + ' <b style="color:var(--text)">' +
             row.value + '</b></span>';
    }).join(''));
  }

  /* ==========================================================================
     4 · Ownership
     ======================================================================== */
  function renderOwnership() {
    set('#chart-owner', C.hbar(S.byOwner.map(function (d) {
      return { label: d.label, value: d.value, color: C.memberColor(d.label) };
    }), { label: 'Tasks owned per member', width: 440, rowH: 38, labelW: 72 }));

    set('#chart-owner-category', C.groupedBars(S.ownerByCategory, {
      label: 'Work streams each member owned tasks in',
      width: 500,
      groupH: 78
    }));

    /* Support appearances — who backed up other people's tasks */
    var sup = D.order.member.concat(['Team']).map(function (name) {
      return { label: name, value: S.bySupport[name] || 0, color: C.memberColor(name) };
    }).filter(function (d) { return d.value > 0; })
      .sort(function (a, b) { return b.value - a.value; });

    set('#chart-support', C.hbar(sup, {
      label: 'Tasks supported per member',
      width: 440, rowH: 34, labelW: 72
    }));
  }

  /* ==========================================================================
     5 · Collaboration
     ======================================================================== */
  function renderCollab() {
    set('#collab-links', S.links.map(function (l) {
      return '<li><span class="pair">' + memberChip(l.a) +
             '<span class="arrow">+</span>' + memberChip(l.b) + '</span>' +
             '<span class="n">' + l.value + '</span></li>';
    }).join(''));

    set('#collab-solo', S.solo);
    set('#collab-shared', S.collaborative);
  }

  /* ==========================================================================
     6 · Critical tasks
     ======================================================================== */
  function renderCritical() {
    set('#crit-cards', S.criticalTasks.map(function (t) {
      return '<article class="crit-card">' +
        '<div class="t">' + esc(t.task) + '</div>' +
        '<div class="meta">' + esc(t.category) + ' · ' + esc(t.size) + '</div>' +
        '<div class="ppl">' + memberChip(t.owner) +
        (t.support ? '<span class="plus">with</span>' + memberChip(t.support) : '') +
        '</div></article>';
    }).join(''));
  }

  /* ==========================================================================
     7 · Atlas + register
     ======================================================================== */
  /* -- Register: filter + sort --------------------------------------------- */
  var sortState = { key: 'id', dir: 1 };

  function fillSelect(sel, values, allLabel) {
    var el = $(sel);
    if (!el) return;
    el.innerHTML = '<option value="">' + esc(allLabel) + '</option>' +
      values.map(function (v) {
        return '<option value="' + esc(v) + '">' + esc(v) + '</option>';
      }).join('');
  }

  function currentRows() {
    var cat = $('#f-category').value;
    var imp = $('#f-impact').value;
    var own = $('#f-owner').value;
    var q   = $('#f-search').value.trim().toLowerCase();

    var rows = D.tasks.filter(function (t) {
      if (cat && t.category !== cat) return false;
      if (imp && t.impact !== imp) return false;
      /* Owner filter includes tasks the person supported — otherwise
         filtering by a name hides half of what they worked on. */
      if (own && t.owner !== own && t.support !== own) return false;
      if (q && t.task.toLowerCase().indexOf(q) === -1) return false;
      return true;
    });

    var ord = {
      impact: D.order.impact,
      size: D.order.size,
      category: D.order.category
    }[sortState.key];

    var k = sortState.key, dir = sortState.dir;
    rows.sort(function (a, b) {
      var x, y;
      if (ord) { x = ord.indexOf(a[k]); y = ord.indexOf(b[k]); }
      else if (k === 'id') { x = a.id; y = b.id; }
      else { x = String(a[k] || '￿'); y = String(b[k] || '￿'); }
      if (x < y) return -1 * dir;
      if (x > y) return 1 * dir;
      return (a.id - b.id) * dir;
    });

    return rows;
  }

  function renderRegister() {
    var rows = currentRows();

    set('#register-body', rows.length
      ? rows.map(function (t) {
          return '<tr>' +
            '<td class="num">' + t.id + '</td>' +
            '<td class="tsk">' + esc(t.task) + '</td>' +
            '<td>' + esc(t.category) + '</td>' +
            '<td>' + impactChip(t.impact) + '</td>' +
            '<td>' + sizeChip(t.size) + '</td>' +
            '<td>' + memberChip(t.owner) + '</td>' +
            '<td>' + memberChip(t.support) + '</td>' +
            '</tr>';
        }).join('')
      : '<tr class="empty-row"><td colspan="7">No tasks match these filters.</td></tr>');

    set('#register-count', rows.length === D.tasks.length
      ? 'All ' + D.tasks.length + ' tasks'
      : rows.length + ' of ' + D.tasks.length + ' tasks');
  }

  function wireRegister() {
    fillSelect('#f-category', D.order.category, 'All work streams');
    fillSelect('#f-impact', D.order.impact, 'All impact levels');
    fillSelect('#f-owner', D.order.member, 'Everyone');

    ['#f-category', '#f-impact', '#f-owner'].forEach(function (s) {
      $(s).addEventListener('change', renderRegister);
    });
    $('#f-search').addEventListener('input', renderRegister);

    $('#f-reset').addEventListener('click', function () {
      $('#f-category').value = '';
      $('#f-impact').value = '';
      $('#f-owner').value = '';
      $('#f-search').value = '';
      sortState = { key: 'id', dir: 1 };
      syncSortIndicators();
      renderRegister();
    });

    Array.prototype.forEach.call(document.querySelectorAll('th[data-key]'), function (th) {
      var btn = th.querySelector('.sort');
      if (!btn) return;
      btn.addEventListener('click', function () {
        var key = th.getAttribute('data-key');
        if (sortState.key === key) sortState.dir *= -1;
        else { sortState.key = key; sortState.dir = 1; }
        syncSortIndicators();
        renderRegister();
      });
    });

    syncSortIndicators();
    renderRegister();
  }

  function syncSortIndicators() {
    Array.prototype.forEach.call(document.querySelectorAll('th[data-key]'), function (th) {
      if (th.getAttribute('data-key') === sortState.key) {
        th.setAttribute('aria-sort', sortState.dir === 1 ? 'ascending' : 'descending');
      } else {
        th.removeAttribute('aria-sort');
      }
    });
  }

  /* ==========================================================================
     8 · Profit share
     ======================================================================== */
  function renderSplit() {
    var sp = D.split;

    set('#stage-bar',
      '<div class="seg reserve" style="flex:' + sp.reserve + '">' +
      '<span>Reserve</span><span class="pc">' + sp.reserve + '%</span></div>' +
      '<div class="seg members" style="flex:' + sp.members + '">' +
      '<span>Member pool</span><span class="pc">' + sp.members + '%</span></div>');

    set('#donut-pool', C.donut(sp.pool.map(function (p) {
      return { label: p.name, value: p.share, color: C.memberColor(p.name) };
    }), {
      size: 272, inner: 74, outer: 132,
      label: 'Member pool split: ' + sp.pool.map(function (p) {
        return p.name + ' ' + p.share + '%';
      }).join(', '),
      sliceLabels: true
    }));

    set('#payout-body', sp.pool.map(function (p) {
      var m = byName[p.name] || {};
      return '<tr data-m="' + esc(p.name) + '">' +
        '<td><div class="who"><span class="bead"></span><div>' +
        '<div class="nm">' + esc(p.name) + '</div>' +
        '<div class="rl">' + esc(m.role || '') + '</div></div></div></td>' +
        '<td class="r"><span class="pc">' + p.share + '%</span></td>' +
        '</tr>';
    }).join(''));

    var poolTotal = sp.pool.reduce(function (a, p) { return a + p.share; }, 0);
    set('#payout-foot',
      '<tr><td>Member pool total</td>' +
      '<td class="r">' + poolTotal + '%</td></tr>');

    set('#pool-legend', sp.pool.map(function (p) {
      return '<span class="legend-item"><span class="k" style="background:' +
             C.memberColor(p.name) + '"></span>' + esc(p.name) +
             ' <b style="color:var(--text)">' + p.share + '%</b></span>';
    }).join(''));
  }

  /* ==========================================================================
     Theme toggle — remembers the choice, tolerates blocked storage
     ======================================================================== */
  function wireTheme() {
    var btn = $('#theme-toggle');
    var root = document.documentElement;
    var KEY = 'pe-review-theme';

    function stored() {
      try { return localStorage.getItem(KEY); } catch (e) { return null; }
    }
    function remember(val) {
      try { localStorage.setItem(KEY, val); } catch (e) { /* private mode */ }
    }
    function effective() {
      var t = root.getAttribute('data-theme');
      if (t) return t;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    function paint() {
      var cur = effective();
      btn.textContent = cur === 'dark' ? '☀ Light' : '☾ Dark';
      btn.setAttribute('aria-label', 'Switch to ' +
        (cur === 'dark' ? 'light' : 'dark') + ' theme');
    }

    var saved = stored();
    if (saved === 'dark' || saved === 'light') root.setAttribute('data-theme', saved);
    paint();

    btn.addEventListener('click', function () {
      var next = effective() === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      remember(next);
      paint();
    });
  }

  /* ==========================================================================
     Boot
     ======================================================================== */
  function renderMeta() {
    /* The workbook name appears in both the masthead and the footer */
    Array.prototype.forEach.call(document.querySelectorAll('.src-workbook'), function (el) {
      el.textContent = D.source.workbook;
    });
    var link = $('#src-link');
    if (link) link.href = D.source.url;

    var d = new Date();
    var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
                  'August', 'September', 'October', 'November', 'December'];
    set('#gen-date', months[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear());
  }

  function boot() {
    try {
      renderMeta();
      renderStats();
      renderPeople();
      renderComposition();
      renderOwnership();
      renderCollab();
      renderCritical();
      wireRegister();
      renderSplit();
      wireTheme();
    } catch (err) {
      /* Surface a failure in the page rather than leaving silent blank panels */
      var banner = document.createElement('div');
      banner.setAttribute('role', 'alert');
      banner.style.cssText = 'margin:16px;padding:16px;border-radius:10px;' +
        'border:1px solid #c3315a;background:#fceaee;color:#6b1226;font:14px ' +
        'ui-monospace,monospace;white-space:pre-wrap';
      banner.textContent = 'The report failed to render: ' + (err && err.message) +
        '\nCheck that assets/js/data.js loaded correctly.';
      document.body.insertBefore(banner, document.body.firstChild);
      if (window.console) console.error(err);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
