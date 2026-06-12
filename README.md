PortfolioV2
==============

Overview
--
This repository contains a personal portfolio website built with plain HTML, CSS, and JavaScript. It is designed to showcase projects, artwork, and web development work. The site is static and can be served directly from the file system or any static web hosting provider.

Contents
--
- `index.html` — Landing page of the portfolio.
- `showcase.html` — Dedicated page for project showcases.
- `assets/` — Images, audio, icons and archived screenshots used across the site.
- `css/` — Stylesheets organized by purpose (layout, panels, mobile, etc.).
- `js/` — Front-end JavaScript for interactions and galleries.

Quick start (local)
--
Open `index.html` in a browser to view the site locally. For a simple local server (recommended to avoid some browser restrictions), run either:

For Python 3:

```powershell
python -m http.server 8000
# then open http://localhost:8000 in your browser
```

Or using Node (if you have `npx` available):

```powershell
npx serve . -l 8000
```

