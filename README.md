# PDFomator

**Minimal Mobile PWA to Pack PDF Pages on a Sheet**

A client-side Progressive Web App that allows you to arrange multiple PDF pages and images into a single printable sheet layout. Perfect for creating handouts, study materials, or print-optimized documents.

## ✨ Features

- **📱 Mobile-First PWA** - Install as an app on any device
- **📄 PDF Support** - Extract and arrange pages from PDF files
- **🖼️ Image Support** - Add images alongside PDF pages
- **📐 Flexible Layouts** - Choose from 1×1 to 5×5 grid layouts
- **📏 Paper Sizes** - A4 and A3 in portrait/landscape orientations
- **⬇️ High-Quality Export** - Export as PDF at 288 DPI
- **🚫 No Build Step** - Zero dependencies, pure ES modules
- **🎨 Clean UI** - Pico CSS for beautiful, accessible design
- **⚡ Offline Ready** - Works without internet connection

## 🚀 Getting Started

### Option 1: Direct Use
1. Simply open `public/index.html` in any modern browser
2. Start adding PDF files or images
3. Arrange them in your preferred grid layout
4. Export as PDF

### Option 2: Local Server (Recommended)
```bash
# Navigate to the public directory
cd public

# Start a simple HTTP server
python -m http.server 8000
# or
npx serve .
# or
php -S localhost:8000

# Open http://localhost:8000
```

## 📱 Installation

### Mobile/Desktop
1. Open the app in your browser
2. Look for "Add to Home Screen" or "Install App" prompt
3. Install for offline access and app-like experience

## 🎯 Usage

1. **Add Content**: Click the `+` button to add PDF files or images
2. **Choose Layout**: Click the `🔲` button to select grid size (1×1 to 5×5)
3. **Change Paper**: Click the `📄` button to cycle through paper sizes
4. **Export**: Click the `⬇️` button to download your layout as PDF

### Keyboard Shortcuts
- `Ctrl/Cmd + O` - Add files
- `Ctrl/Cmd + E` - Export PDF
- `Esc` - Close overlays

## 🛠️ Technical Stack

- **Frontend**: Vanilla JavaScript (ES Modules)
- **Styling**: [Pico CSS](https://picocss.com) (class-less, ~10kB)
- **PDF Rendering**: [PDF.js](https://github.com/mozilla/pdf.js)
- **Image Capture**: [html2canvas](https://github.com/niklasvh/html2canvas)
- **PDF Generation**: [jsPDF](https://github.com/parallax/jsPDF)
- **PWA**: Service Worker + Web App Manifest

## 📁 Project Structure

```
public/
├── index.html          # Main HTML file
├── styles.css          # Custom styles (built on Pico CSS)
├── main.js             # Core application logic
├── manifest.json       # PWA manifest
├── sw.js              # Service worker for offline support
└── libs/              # Local library fallbacks
    ├── pdf.min.js     # PDF.js for PDF rendering
    ├── html2canvas.min.js # DOM to canvas conversion
    └── jspdf.umd.min.js   # PDF generation
```

## 🌟 Key Design Decisions

- **No Build Process**: Direct browser compatibility, easy deployment
- **Class-less CSS**: Pico CSS provides beautiful defaults without custom classes
- **Progressive Enhancement**: Works on all devices, enhanced on capable ones
- **Client-Side Only**: No server required, complete privacy
- **High DPI Export**: 3x scaling for crisp printed output

## 🔮 Future Enhancements

- [ ] Drag-and-drop cell reordering
- [ ] Vector PDF export via pdf-lib
- [ ] Pinch-to-zoom support
- [ ] Dark mode toggle
- [ ] Custom paper sizes
- [ ] Page rotation controls
- [ ] Batch PDF processing
- [ ] Template saving/loading
- [ ] Cloud storage integration

## 🤝 Contributing

This project uses vanilla technologies to remain accessible and educational. Contributions are welcome!

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🙏 Acknowledgments

- [Pico CSS](https://picocss.com) for the beautiful, accessible styling
- [PDF.js](https://github.com/mozilla/pdf.js) for client-side PDF rendering
- [html2canvas](https://github.com/niklasvh/html2canvas) for DOM capture
- [jsPDF](https://github.com/parallax/jsPDF) for PDF generation
The clean way to fit more
