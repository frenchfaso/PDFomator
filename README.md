# PDFomator

**Minimal Mobile PWA to Pack PDF Pages and Images on a Sheet**

[![Security](https://img.shields.io/badge/security-audited-brightgreen)](AUDIT_REPORT.md)
[![Version](https://img.shields.io/badge/version-1.2.2-blue)](sw.js)
[![Production](https://img.shields.io/badge/status-production%20ready-success)](AUDIT_SUMMARY.md)

A client-side Progressive Web App that arranges multiple PDF pages and images into customizable grid layouts for printing or presentation.

**🔒 Security**: Recently audited and patched - [View Audit Report](AUDIT_INDEX.md)

## 🚀 Features

- **📱 Mobile-First PWA** - Install as an app, works offline
- **📄 PDF Page Selection** - Choose specific pages from multi-page PDFs
- **🖼️ Image Support** - Add JPG, PNG, and other image formats
- **📐 Flexible Grids** - 1×1 to 5×5 grid layouts with visual preview
- **📏 Paper Sizes** - A4/A3 in portrait/landscape orientations
- **🎯 Smart Image Fitting** - Contain, cover, or fill modes with visual indicators
- **� Rotation Control** - Rotate images 90° clockwise with persistent rotation through mode changes
- **�👆 Touch Controls** - Pan, zoom, and pinch gestures for precise positioning
- **⌨️ Keyboard Shortcuts** - ESC to close dialogs, Ctrl/Cmd+E to export
- **🗑️ Easy Management** - Click to remove content, reset transformations
- **⬇️ High-Quality Export** - Standard or HD quality PDF output
- **🚫 No Server Required** - Runs entirely in your browser

## 📱 Quick Start

1. **Open**: Visit [PDFomator](https://frenchfaso.github.io/PDFomator/) or run locally
2. **Grid**: Click `🔲` to select layout (e.g., 2×2 for 4 pages per sheet)
3. **Add**: Click any cell to add PDF pages or images
4. **Adjust**: Click images to cycle fit modes, use rotation button (↻) to rotate 90°, drag/pinch to position in cover mode
5. **Size**: Click `📄` to change paper size/orientation
6. **Export**: Click `⬇️` to choose quality and download your arranged PDF

## 💡 Tips

- **Fill Modes**: Click images to cycle between contain (fit), cover (fill+crop), and fill (stretch)
- **Rotation**: Use the yellow rotation button (↻) in bottom-left corner to rotate images 90° clockwise
- **Cover Mode**: In cover mode, use touch gestures to pan and zoom for perfect positioning
- **Keyboard**: Press ESC to close dialogs, Ctrl/Cmd+E for quick export
- **Quality**: Choose Standard for faster exports or HD for maximum quality

## 📋 Recent Audit

PDFomator underwent a comprehensive security and code quality audit on December 8, 2024:
- ✅ **2 security vulnerabilities** identified and patched
- ✅ **Accessibility improvements** implemented (ARIA attributes, focus management)
- ✅ **Code quality enhancements** applied (extracted constants, better organization)
- ✅ **Score: 8.5/10** - Production ready

**[View Complete Audit Documentation →](AUDIT_INDEX.md)**
