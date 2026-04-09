# AGENTS

## Run / Verify
- Serve locally with `python3 -m http.server 8080` from repo root (`.vscode/tasks.json`); use `http://localhost:8080/` for any PWA or service-worker work.
- There is no package manifest, build, lint, typecheck, or automated test config in this repo. Verification is manual in the browser.
- Good smoke test after UI/rendering changes: add an image, add a PDF page, switch grid and paper size, test cover-mode pan/zoom plus rotate, add a second page with a different grid, then export both `SD` and `HD`.

## Structure
- This is a flat static app for GitHub Pages: `index.html`, `main.js`, `styles.css`, `sw.js`, and `manifest.json` all live in repo root.
- `index.html` is the only entrypoint. It loads local vendored runtime assets plus `main.js`; `init()` in `main.js` registers the service worker, configures PDF.js, renders the current page, and binds the UI.
- The real app state is `appState.pages` plus `appState.currentPageIndex`; `layoutState` in `main.js` is a proxy to the current page only. Sheet dimensions are millimeters and drive both the SVG `viewBox` and jsPDF export, so keep layout math in mm rather than CSS pixels.

## Rendering / Export
- `renderSVGSheet()` splits SVG output into `#content-layer` and `#ui-layer`. Export hides `#ui-layer` and rasterizes the SVG into jsPDF, so anything that must appear in the PDF belongs in the content layer.
- Export is multipage now: `assemblePDF()` walks `appState.pages`, renders each page in order, and restores the previously active page at the end.
- For cover-mode pan/zoom, update `cellData.transform` and call `updateSingleCell(cellIndex)`; avoid full `renderSVGSheet()` inside interaction loops.
- Rotation is implemented by `rotateImageData()` as a real 90 degree pixel rotation, then transforms are reset. Do not add a separate rotation field or SVG rotate transform unless you also redesign export behavior.

## Cache / External Deps
- This app is offline-first now: critical runtime deps are vendored under `vendor/` and loaded locally from `index.html`, `main.js` (`CONFIG.pdfWorkerUrl`), and `sw.js` (`STATIC_ASSETS`).
- Keep CSP and service-worker cache rules aligned with any new runtime asset, especially anything needed before export or PDF import can work offline.
- Bump `CACHE_NAME` in `sw.js` whenever cached app files or `vendor/` assets change. That cache name also drives the version label in the header and the app update flow.

## Known Gap
- `manifest.json` defines shortcuts for `?action=add` and `?action=export`, but `main.js` does not parse query params yet. Do not assume those shortcuts are wired.
