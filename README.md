# Portfolio

Personal portfolio site: a homepage with a short overview of each project, plus a separate in-depth write-up page for every project.

**Live:** [junaydelahi.dev](https://junaydelahi.dev)

## Stack

Plain HTML, CSS and JavaScript. No framework, no build step and no dependencies, apart from Google Fonts.

- Responsive layout with light and dark themes
- Scroll-reveal and hover animations that respect `prefers-reduced-motion`
- Project filtering, scrollspy navigation and an auto-generated contents list on project pages
- Hosted on GitHub Pages with a custom domain

## Structure

```
.
├── index.html          Homepage: overview, projects, about, experience, skills, contact
├── projects/           One write-up page per project
├── css/style.css       All styles. Design tokens (colours, type scale, spacing) are at the top
├── js/main.js          Interactions and animations
├── assets/             Images and CV
└── CNAME               Custom domain for GitHub Pages
```

## Run locally

Any static file server works, for example:

```bash
python -m http.server 8000
```

Then open http://localhost:8000.

## Customising

- **Colours, fonts, type scale and spacing** are CSS variables at the top of `css/style.css`. Change them there rather than in individual rules.
- **Add a project:** copy an `<article class="card">` block in `index.html` and one of the pages in `projects/`, then link the card to the new page. The "On this page" list builds itself from the page's `h2` headings.
- **Project filters** use the card's `data-tags` attribute, for example `data-tags="healthcare ml"`.

## Deployment

Pushing to `main` deploys automatically through GitHub Pages. The custom domain is set in `CNAME` and points to GitHub Pages through DNS A records.
