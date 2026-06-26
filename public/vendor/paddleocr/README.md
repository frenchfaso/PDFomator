PaddleOCR browser test assets
=============================

This directory vendors a local-only PaddleOCR.js experiment for PDFomator.

- `paddleocr-browser.mjs` is a browser ESM bundle generated from `@paddleocr/paddleocr-js@0.4.2` with ONNX Runtime WebGPU support bundled through `onnxruntime-web`.
- `assets/worker-entry-C9UNuyOJ.js` is the PaddleOCR.js worker bundle used to keep OCR initialization and inference off the main UI thread.
- `ort-wasm-simd-threaded.asyncify.*` and `ort-wasm-simd-threaded.jsep.*` are ONNX Runtime Web fallback/runtime assets.
- `models/PP-OCRv6_small_*_onnx_infer.tar` are uncompressed PaddleOCR model archives loaded through the SDK's `textDetectionModelAsset` and `textRecognitionModelAsset` options.

Runtime model and worker assets are loaded from same-origin paths under `vendor/paddleocr/`.
