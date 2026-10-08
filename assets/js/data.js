/* ============================================================================
   Pet Escape — Performance Review · source data
   ----------------------------------------------------------------------------
   Transcribed verbatim from the "Tasks List" sheet of
   "Nat20 Studio - Performance Review - Pet Escape" (Google Sheets).

   Exposed as a global rather than loaded as JSON over fetch(), because this
   page is meant to open by double-clicking index.html. A fetch() of a sibling
   file is blocked by the browser's CORS rules on the file:// scheme, which
   would leave every chart empty.

   To update: edit the arrays below and reload. Nothing is generated or built.
   ========================================================================== */

(function () {
  'use strict';

  /* -- People ---------------------------------------------------------------
     `key` is ASCII so it is safe to use in CSS class names and data
     attributes; `name` carries the correct Vietnamese diacritics for display. */
  var MEMBERS = [
    {
      key: 'phu',
      name: 'Phú',
      role: 'Coordinator & Facilitator',
      blurb: 'Task breakdown, assignment, progress tracking and final acceptance, ' +
             'alongside core systems, tooling and release.'
    },
    {
      key: 'phong',
      name: 'Phong',
      role: 'Engineering',
      blurb: 'Core gameplay and the hardest technical problems — splines and mesh ' +
             'deformation, shading, game feel.'
    },
    {
      key: 'hieu',
      name: 'Hiếu',
      role: 'Game Design',
      blurb: 'Design document, level design and creatives, gameplay QA, store ' +
             'listing and SFX.'
    },
    {
      key: 'duong',
      name: 'Dương',
      role: 'Art',
      blurb: 'Mascot, UI design and logo — the game’s entire visual identity.'
    },
    {
      key: 'team',
      name: 'Team',
      role: 'Collective',
      blurb: 'Tasks where the whole team contributed support rather than one ' +
             'named person.',
      collective: true
    }
  ];

  /* -- Ordinal scales used by the sheet ------------------------------------ */
  var IMPACT_ORDER = ['Critical', 'High', 'Medium', 'Low'];
  var SIZE_ORDER   = ['Large', 'Medium', 'Small'];
  var CATEGORY_ORDER = ['Ideation', 'Code', 'Design', 'Art', 'Marketing', 'Others'];

  /* -- The task matrix ------------------------------------------------------
     33 rows, in sheet order. [category, task, impact, size, owner, support]
     An empty support field means the task had a single named owner. */
  var ROWS = [
    ['Ideation',  'Idea Owner',                   'Critical', 'Medium', 'Phong', 'Team'],
    ['Code',      'Web Prototype',                'Medium',   'Medium', 'Hiếu',  ''],
    ['Code',      'Setup Core',                   'High',     'Small',  'Phú',   'Phong'],
    ['Code',      'Basic Gameflow',               'Critical', 'Large',  'Phong', ''],
    ['Code',      'Setup UI System',              'High',     'Medium', 'Phú',   ''],
    ['Code',      'Level Editor',                 'High',     'Large',  'Phú',   'Hiếu'],
    ['Code',      'Tutorial System',              'Medium',   'Large',  'Phú',   'Phong'],
    ['Code',      'Lose Detection System',        'High',     'Medium', 'Phú',   ''],
    ['Code',      'Blocker System',               'High',     'Medium', 'Phú',   ''],
    ['Code',      'Blocker System Gamefeel',      'High',     'Medium', 'Phong', ''],
    ['Code',      'Economy System',               'Low',      'Small',  'Phú',   ''],
    ['Code',      'Spline & Mesh',                'High',     'Large',  'Phong', ''],
    ['Code',      'Board Geometry & Wall',        'Medium',   'Small',  'Phong', ''],
    ['Code',      'Paint & Input System',         'High',     'Medium', 'Phong', 'Phú'],
    ['Code',      'Shading & Lighting',           'Medium',   'Medium', 'Phong', ''],
    ['Code',      'Pet Animation',                'Medium',   'Medium', 'Phong', ''],
    ['Code',      'Scaling System',               'Medium',   'Medium', 'Phong', 'Phú'],
    ['Code',      'Cheat Tool',                   'Medium',   'Small',  'Phong', 'Phú'],
    ['Code',      'VFX',                          'High',     'Medium', 'Phú',   'Phong'],
    ['Code',      'Gamefeel Improvement',         'High',     'Large',  'Phong', 'Phú'],
    ['Code',      'Technical QA',                 'Critical', 'Medium', 'Phong', 'Phú'],
    ['Code',      'Gameplay QA',                  'Critical', 'Medium', 'Hiếu',  'Phong'],
    ['Code',      'Final Acceptance QA',          'Critical', 'Large',  'Phú',   'Phong'],
    ['Design',    'Game Design Document',         'High',     'Medium', 'Hiếu',  ''],
    ['Design',    'Level Design',                 'Critical', 'Large',  'Hiếu',  'Team'],
    ['Design',    'Creatives Level Design',       'Medium',   'Small',  'Hiếu',  ''],
    ['Art',       'Mascot Design',                'Medium',   'Large',  'Dương', ''],
    ['Art',       'UI Design',                    'High',     'Large',  'Dương', 'Team'],
    ['Art',       'Logo',                         'Medium',   'Small',  'Dương', ''],
    ['Marketing', 'Store Listing',                'Medium',   'Small',  'Hiếu',  'Phú'],
    ['Marketing', 'SFX',                          'Medium',   'Large',  'Hiếu',  'Phú'],
    ['Code',      'Build & Monitor',              'Critical', 'Medium', 'Phú',   'Phong'],
    ['Others',    'Recruit & Manage Freelancers', 'High',     'Medium', 'Phú',   '']
  ];

  /* -- Agreed profit share -------------------------------------------------
     Two stages, exactly as the sheet's "Divide Percentage" block states it:
     profit splits 50 / 50 between a retained reserve and the member pool,
     then the member pool splits four ways. */
  var SPLIT = {
    reserve: 50,
    members: 50,
    pool: [
      { name: 'Phú',   share: 32 },
      { name: 'Phong', share: 32 },
      { name: 'Hiếu',  share: 24 },
      { name: 'Dương', share: 12 }
    ]
  };

  var SOURCE = {
    workbook: 'Nat20 Studio - Performance Review - Pet Escape',
    sheet: 'Tasks List',
    url: 'https://docs.google.com/spreadsheets/d/1fr2AMW-lzW0G8v0czFonVe6MSZ8eBz9HLx0ObjLc-hg/edit?gid=1466775253',
    project: 'Pet Escape',
    studio: 'Nat20 Studio'
  };

  /* -- Shape the rows into objects, and derive the cross-tabs the charts need.
        All of this is counting: nothing here weights, scores or ranks people. */
  var tasks = ROWS.map(function (r, i) {
    return {
      id: i + 1,
      category: r[0],
      task: r[1],
      impact: r[2],
      size: r[3],
      owner: r[4],
      support: r[5] || null
    };
  });

  function tally(list, pick) {
    var out = {};
    list.forEach(function (t) {
      var k = pick(t);
      if (k === null || k === undefined || k === '') return;
      out[k] = (out[k] || 0) + 1;
    });
    return out;
  }

  function orderedTally(list, pick, order) {
    var t = tally(list, pick);
    return order.map(function (k) { return { label: k, value: t[k] || 0 }; });
  }

  var memberNames = MEMBERS.filter(function (m) { return !m.collective; })
                           .map(function (m) { return m.name; });

  /* Owner × Category — where each person's work actually sat. */
  var ownerByCategory = memberNames.map(function (name) {
    return {
      label: name,
      cells: CATEGORY_ORDER.map(function (cat) {
        return {
          label: cat,
          value: tasks.filter(function (t) {
            return t.owner === name && t.category === cat;
          }).length
        };
      })
    };
  });

  /* Collaboration links: undirected pair counts across the support column.
     Direction is dropped deliberately — "A supported B" and "B supported A"
     are the same working relationship, and collapsing them is what exposes
     the Phú/Phong axis. Reciprocity is reported separately below. */
  var pairMap = {};
  tasks.forEach(function (t) {
    if (!t.support) return;
    var a = t.owner, b = t.support;
    var k = [a, b].sort().join('|');
    if (!pairMap[k]) pairMap[k] = { a: a, b: b, value: 0, detail: [] };
    pairMap[k].value += 1;
    pairMap[k].detail.push({ owner: a, support: b, task: t.task });
  });
  var links = Object.keys(pairMap).map(function (k) { return pairMap[k]; })
                    .sort(function (x, y) { return y.value - x.value; });

  var collaborative = tasks.filter(function (t) { return !!t.support; }).length;

  window.REVIEW = {
    source: SOURCE,
    members: MEMBERS,
    tasks: tasks,
    order: {
      impact: IMPACT_ORDER,
      size: SIZE_ORDER,
      category: CATEGORY_ORDER,
      member: memberNames
    },
    split: SPLIT,
    stats: {
      total: tasks.length,
      categories: CATEGORY_ORDER.length,
      members: memberNames.length,
      critical: tasks.filter(function (t) { return t.impact === 'Critical'; }).length,
      collaborative: collaborative,
      solo: tasks.length - collaborative,
      byCategory: orderedTally(tasks, function (t) { return t.category; }, CATEGORY_ORDER),
      byImpact:   orderedTally(tasks, function (t) { return t.impact; },   IMPACT_ORDER),
      bySize:     orderedTally(tasks, function (t) { return t.size; },     SIZE_ORDER),
      byOwner:    orderedTally(tasks, function (t) { return t.owner; },    memberNames),
      bySupport:  tally(tasks, function (t) { return t.support; }),
      ownerByCategory: ownerByCategory,
      links: links,
      criticalTasks: tasks.filter(function (t) { return t.impact === 'Critical'; })
    }
  };
})();
