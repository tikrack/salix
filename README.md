# salix — GitHub Pages site

A single-page field guide for **salix**, published from the `gh-pages` branch.

```
site/
├── index.html    the guide: hero, engines, model, repo, migrations, API index, notes
├── styles.css    paper-and-ink styling, responsive, RTL-aware
└── app.js        draws the willow, renders per-engine DDL, copy buttons, EN/FA toggle
```

No build step and no dependencies: open `index.html` directly, or publish the
three files as-is.

## Publishing

The branch holds the site at its root, which is what GitHub Pages expects for a
project page served from a branch:

```sh
git push origin gh-pages
```

Then set **Settings → Pages → Source → Deploy from a branch → `gh-pages` / `root`**.
The site lands at `https://tikrack.github.io/salix/`.

## Editing

- **Text** lives in `index.html`. Elements carrying both `data-en` and `data-fa`
  are swapped by the language toggle; the English text is the default content.
- **Generated DDL** per engine is the `DDL` map at the top of `app.js`. The
  strings mirror exactly what `salix` renders (identifiers quoted with `"` on
  SQLite/PostgreSQL and `` ` `` on MySQL).
- **The willow** is drawn in `willow()` in `app.js` as SVG paths — a trunk,
  limbs, drooping strands and leaf ticks — then animated with `stroke-dashoffset`
  and a slow `sway` rotation. Respects `prefers-reduced-motion`.
- **Colours and type** are the CSS variables at the top of `styles.css`.

## Language

`app.js` switches `dir` and `lang` on `<html>` and swaps every `[data-en]`
element. The choice is kept in `localStorage` under `salix-lang`.
