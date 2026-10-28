# Tajikistan–Kyrgyzstan Borderlands

Interactive maps and analysis for UNDP Tajikistan, prepared by Hugh Lamarque.

The site covers Sughd, Batken, Nookat and the Osh approach, with a shared map and analysis workspace. The home page compares population and density for the five largest Tajik district populations within the study area.

## Publishing

GitHub Pages is published by `.github/workflows/pages.yml` from `dist/` whenever `main` changes. The repository Pages source must be **GitHub Actions**. No build step is required.

## Files and local preview

All browser code, bundled libraries, processed datasets and downloads are in `dist/`. Serve that folder with an HTTP server, for example `python3 -m http.server 8000 --directory dist`, then open `http://localhost:8000/`.

The application uses relative asset paths so it works under a GitHub Pages project path. Source and method notes are available inside the site. Population estimates refer to the portions of districts within the study, not whole-district census totals. National boundaries are an OpenStreetMap cartographic reference; the display trims distant extensions without changing the source boundary network or analytical geography.

Data sources retain their original attribution and terms. The site includes limitations and coverage information for each indicator.
