/* ==========================================================================
   AJAL ARCHITECTS — PROJECT DATA
   --------------------------------------------------------------------------
   This is the only file you need to edit to add, remove or reorder work.

   Each project:
     id        unique slug, no spaces            "shreyas-retreat"
     title     project name                       "Shreyas Retreat"
     category  one of: residential | workplace | hospitality | interiors | public
     location  city / region                      "Nandi Hills"
     year      completion year (or "Ongoing")     2024
     status    "Completed" | "Under construction" | "Concept"
     area      built-up area, free text           "6,400 sq ft"
     client    optional                           "Private"
     cover     main image (landscape works best)  "slider1.jpg"
     images    extra images for the case study    ["a.jpg", "b.jpg"]
     summary   2–4 sentences for the case study
     featured  true → also appears in the big 3D gallery on the homepage

   Images: drop the file in the project folder and use its filename. A missing
   file never shows as broken — it renders a labelled blueprint placeholder.
   ========================================================================== */

window.AJAL_PROJECTS = [
  {
    id: "arched-villa",
    title: "The Arched Villa",
    category: "residential",
    location: "Bengaluru",
    year: 2025,
    status: "Proposed",
    area: "—",
    cover: "slider1.jpg",
    images: ["slider1.jpg"],
    summary:
      "A three-level family home behind a layered gate wall. Deep cornices shade the arched openings, a pergola crowns the roof terrace, and planted ledges pull the garden up the building.",
    featured: true
  },
  {
    id: "padma-residence",
    title: "Padma Residence",
    category: "residential",
    location: "Bengaluru",
    year: 2025,
    status: "Proposed",
    area: "—",
    client: "Mrs. Padma",
    cover: "carousel_2.jpg",
    images: ["carousel_2.jpg"],
    summary:
      "Flat roof planes, a timber-framed porte-cochère and full-width glass balconies. The upper floor projects over the drive to shade the ground-floor living spaces through the afternoon.",
    featured: true
  },
  {
    id: "gowda-residence",
    title: "Gowda Residence",
    category: "residential",
    location: "Bengaluru",
    year: 2025,
    status: "Proposed",
    area: "—",
    cover: "carousel_1.jpg",
    images: ["carousel_1.jpg"],
    summary:
      "A wide-fronted home wrapped by a dark planted band at first-floor level. A timber-lined roof canopy with a circular cut-out shades the terrace above.",
    featured: true
  },
  {
    id: "convention-hall",
    title: "Convention Hall",
    category: "public",
    location: "Karnataka",
    year: 2025,
    status: "Proposed",
    area: "—",
    cover: "slider2.jpg",
    images: ["slider2.jpg"],
    summary:
      "A brick-and-glass event venue with a vertical name fin, timber soffits and a fully glazed ground floor that opens the foyer to the street.",
    featured: true
  },
  {
    id: "house-005",
    title: "House 005",
    category: "residential",
    location: "Bengaluru",
    year: 2025,
    status: "Proposed",
    area: "—",
    cover: "carousel_3.jpg",
    images: ["carousel_3.jpg"],
    summary:
      "A compact plot made generous: a stone-clad feature wall, a cantilevered timber balcony with planter, and a slatted gate that screens the parking.",
    featured: true
  },

  /* ---- Empty slots: replace the image, text and details with your own ---- */
  {
    id: "project-06",
    title: "Your next project",
    category: "workplace",
    location: "City",
    year: 2026,
    status: "Concept",
    area: "—",
    cover: "project-06.jpg",
    images: [],
    summary: "Add your project description here.",
    featured: false
  },
  {
    id: "project-07",
    title: "Your next project",
    category: "hospitality",
    location: "City",
    year: 2026,
    status: "Concept",
    area: "—",
    cover: "project-07.jpg",
    images: [],
    summary: "Add your project description here.",
    featured: false
  },
  {
    id: "project-08",
    title: "Your next project",
    category: "interiors",
    location: "City",
    year: 2026,
    status: "Concept",
    area: "—",
    cover: "project-08.jpg",
    images: [],
    summary: "Add your project description here.",
    featured: false
  }
];
