# PDFomator

**Pack PDF pages, images, and camera shots into clean printable sheets.**

PDFomator is a small mobile-first PWA for quick paper layouts: drop content into cells, choose a grid, adjust the fit, and export a ready-to-print PDF.

[Open PDFomator](https://frenchfaso.github.io/PDFomator/)

## What It Does

- Arrange PDF pages and images on A4/A3 sheets.
- Add more output pages when one sheet is not enough.
- Pan, zoom, crop, rotate, and apply simple document filters.
- Run local OCR so exported PDFs can include selectable invisible text.
- Work offline after the first load.

## Local First

PDFomator runs in your browser. PDF handling, image processing, OCR, and export stay on the device; no external OCR API is used.

## Run Locally

```sh
python3 -m http.server 8080
```

Then open `http://localhost:8080/`.
