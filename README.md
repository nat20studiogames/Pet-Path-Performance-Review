# Pet Escape — Performance Review & Profit Share

A self-contained static report built from the "Tasks List" sheet of
**Nat20 Studio - Performance Review - Pet Escape**.

## Opening it

Double-click `index.html`. That's it — no server, no install, no build step.

The page makes **no network requests**: no CDN, no web fonts, no analytics. It
works offline and on a machine with no developer tooling installed. The only
external URL in the project is the `href` on the "Source" link back to the
original Google Sheet.

## What's in it

| Section | Contents |
|---|---|
| 01 · The team | Each member, their lane, and how many tasks they owned |
| 02 · Method | What the sheet's Work stream / Impact / Size / Owner columns mean |
| 03 · Composition | Task mix by work stream, impact and size |
| 04 · Ownership | Tasks owned and supported per member, and which streams each worked in |
| 05 · Collaboration | Which pairs shared tasks, and how many |
| 06 · Critical path | The seven tasks rated Critical |
| 07 · Register | All 33 tasks in a filterable, sortable table |
| 08 · Profit share | The agreed two-stage split |

Also included: light/dark themes (remembered between visits), a print
stylesheet for exporting to PDF, and responsive layout down to phone width.

## Scope

The report **describes** the recorded work and **states** the agreed split. It
deliberately does not derive, weight, score or rank contributions, and it draws
no comparison between how work was distributed and how profit was divided — the
share shown is the team's decision, not a calculated result.

Ownership is reported as task *counts* rather than percentages for the same
reason: a count says what somebody carried without implying a formula for what
they are owed.

## Updating the figures

All data lives in one place: **`assets/js/data.js`**. Nothing is generated and
nothing is cached — edit the file and reload the page.

- **Tasks** — the `ROWS` array, one entry per task:
  `['Category', 'Task name', 'Impact', 'Size', 'Owner', 'Support']`.
  Leave the last field as `''` for a solo task, or use `'Team'` when the whole
  group contributed. Every chart, count, filter and cross-tab is derived from
  this array, so adding a row is enough — nothing else needs touching.
- **Profit share** — the `SPLIT` object, holding the reserve/member percentages
  and the four-way pool.
- **People** — the `MEMBERS` array, holding each person's display name, role
  label and short description.

Valid values are `Critical | High | Medium | Low` for impact, `Large | Medium |
Small` for size, and for category any of `Ideation | Code | Design | Art |
Marketing | Others`. To introduce a new category or person, add it to the
matching `*_ORDER` / `MEMBERS` list as well, and give a new person a colour in
`assets/css/styles.css` (the `[data-m="…"]` block) and in `MEMBER_TOKEN` in
`assets/js/charts.js`.

## Files

```
index.html               page structure
assets/css/styles.css    design tokens, layout, themes, print rules
assets/js/data.js        ← the only file you need to edit
assets/js/charts.js      hand-rolled SVG chart builders
assets/js/app.js         rendering, table filter/sort, theme toggle
```

## Notes

- Files are UTF-8 and the page declares `<meta charset="utf-8">`; the
  Vietnamese names depend on both. If you re-save a file in another encoding
  the names will render as mojibake.
- Chart colours are emitted as `style="fill:var(--token)"` rather than fixed
  hex values, which is what lets every chart recolour instantly when the theme
  changes. CSS variables do *not* resolve inside SVG presentation attributes
  (`fill="var(--x)"` silently fails), so keep them in the `style` attribute.
- Charts are deliberately kept to plain bars, a stacked strip and a single pie.
  Denser forms (a node-link collaboration diagram, a task atlas, an impact ×
  size matrix) were tried and removed as too hard to read at a glance.
