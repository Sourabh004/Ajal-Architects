# Ajal Architects — website

A static site with no build step. Three.js, GSAP and Lenis load from pinned CDN versions.

```bash
python -m http.server 5500
```

Then open <http://localhost:5500>.

## Adding your projects

Edit **`projects.js`** only. Each project is one entry:

```js
{
  id: "lake-house",                 // unique, no spaces
  title: "Lake House",
  category: "residential",          // residential | workplace | hospitality | interiors | public
  location: "Mysuru",
  year: 2026,
  status: "Completed",              // Completed | Under construction | Proposed | Concept
  area: "5,200 sq ft",
  client: "Private",                // optional
  cover: "lake-house-1.jpg",        // main image, landscape
  images: ["lake-house-2.jpg", "lake-house-3.jpg"],   // case-study gallery
  summary: "Two to four sentences about the project.",
  featured: true                    // true = also shown in the big 3D gallery
}
```

Put the image files in the project folder. The filter buttons, index list, 3D gallery and
case-study page all build themselves from this file. A missing image never shows as broken:
it renders a blueprint placeholder with the filename it is waiting for.

Images to add now: `project-06.jpg`, `project-07.jpg`, `project-08.jpg` (or delete those
three slots), and team portraits `team-01.jpg` … `team-04.jpg` (3:4 portrait).

## What's on the page

| Section | Effect |
| --- | --- |
| Hero | Three.js villa: blueprint lines draw in, solids drop into place; on scroll the camera orbits, the sun moves from morning to dusk, then the floors separate into an exploded axonometric with live labels |
| Marquee | Speed and skew follow scroll velocity |
| Studio | Words light up as you read; animated counters |
| Services | 3D tilt cards with a cursor-follow glow; icons redraw on hover |
| Featured work | Pinned horizontal gallery with cards curved in 3D (swipe on mobile) |
| Index | Filterable list with a floating preview that tilts with cursor speed |
| Process | A CSS 3D cube turns one face per step |
| Principles | Rows hinge down into place on scroll |
| Footer | Gold wordmark rises letter by letter |

Every project opens a full-screen case study (Esc to close, ← → to step through).
`prefers-reduced-motion` is respected, and without WebGL the hero falls back to a photo.

## Files

| File | Contains |
| --- | --- |
| `index.html` | Markup |
| `styles.css` | All styles; colour and type tokens are at the top |
| `main.js` | Scrolling, animations, gallery, index, case study, form |
| `scene.js` | The 3D hero building |
| `projects.js` | Project data |

## Before going live

- **All copy except the project names is placeholder**: team names, awards, stats,
  the timeline, address, phone, email and social links (`href="#"`). Replace or remove them.
- The contact form opens the visitor's email app addressed to `studio@ajalarchitects.com`.
  Change that address in `main.js` (`initForm`), or swap in a form service such as Formspree.
- `AJ_MAIN_LOGO.png` (5.5 MB) is kept as the source file; the site uses `logo.png` (320 px).
