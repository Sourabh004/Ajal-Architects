# Ajal Architects — website

A static site. No build step, no dependencies, no `package.json` — open it with any
static file server and it runs.

```bash
python -m http.server 5500
```

Then visit <http://localhost:5500>.

---

## Adding your images

The site is built so that **a missing image is never a broken image**. Any `<img>`
that fails to load is replaced at runtime with a labelled blueprint plate showing
the exact filename it wants. Drop a file with that name into the project root and
it renders on the next reload — no markup changes needed.

These slots are currently waiting for files:

| Filename | Where it appears | Suggested crop |
| --- | --- | --- |
| `project-06.jpg` | Projects — Laterite Offices | 4:3 landscape |
| `project-07.jpg` | Projects — Backwater Pavilions | 4:3 landscape |
| `project-08.jpg` | Projects — Ochre Apartment | 4:3 landscape |
| `team-01.jpg` | Team — Ajal Menon | 3:4 portrait |
| `team-02.jpg` | Team — Neha Raghavan | 3:4 portrait |
| `team-03.jpg` | Team — Imran Sheikh | 3:4 portrait |
| `team-04.jpg` | Team — Divya Prakash | 3:4 portrait |

Images already wired up: `slider1.jpg`, `slider2.jpg`, `carousel_1.jpg`,
`carousel_2.jpg`, `carousel_3.jpg` (projects + hero), and `AJ_MAIN_LOGO.png`.

### Adding a whole new project

Copy any `<article class="card">` block in `index.html`, change the image `src`,
the title, the meta line, and the `data-cat` value. `data-cat` must be one of
`residential`, `workplace`, `hospitality`, `interiors` — that is what the filter
buttons match on. Add `card--wide` to the class list to make it a full-width row.

The hover brackets, tilt, reveal animation and cursor states are attached by
`script.js` automatically. You do not need to add them by hand.

---

## Files

| File | Contains |
| --- | --- |
| `index.html` | All markup. Sections are in source order: hero → statement → projects → manifesto → story → team → awards → contact. |
| `home.css` | Design tokens, base type, preloader, hero, and shared section furniture. |
| `nav.css` | Fixed nav bar and the fullscreen mobile menu. |
| `product.css` | Projects grid, cards, and the missing-image slot system. |
| `footer.css` | Footer layout. |
| `script.js` | Interaction engine — theme, preloader, scroll reveals, split text, nav, filter, tilt, counters, hero lattice, timeline. |
| `footer.js` | Builds the footer markup, plus the contact form, newsletter and back-to-top. |

## Theme

Dark ink is the default and lives in `:root`, so the page paints dark on the first
frame with no white flash. Light ("paper") is the opt-in override on
`<html data-theme="light">`; a toggle in the nav switches between them and the
choice persists in `localStorage`. A small inline script in `<head>` applies a saved
preference before first paint.

Both themes read from the same custom properties at the top of `home.css` — change a
colour there and it updates everywhere. The hero and the transparent nav pin their
own light-on-dark tokens, because they always sit on a dark photograph.

## Known gaps

- **The contact form has no backend.** It validates, then reports success locally.
  Replace the `setTimeout` in `footer.js` (`ContactForm.init`) with a real `fetch()`
  when you have an endpoint. The newsletter field is the same.
- **`AJ_MAIN_LOGO.png` is 5.5 MB**, which is very large for a logo shown at 38px.
  Exporting it at ~200px wide would cut most of the page's initial weight.
- All copy — project names, team bios, awards, the manifesto — is placeholder text
  written to fit the layout. Replace it with the studio's real content.
