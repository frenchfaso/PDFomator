# PDFomator - Copilot Instructions

## Project Overview
PDFomator is a minimal Progressive Web App (PWA) designed for mobile-first usage. The app allows users to arrange PDF pages and images into customizable grid layouts on different paper sizes (A4, A3) and export the result as a new PDF. The primary use case is combining multiple content pieces onto a single sheet for printing or presentation purposes.

## Architecture & Technology Stack
- **Frontend**: Vanilla JavaScript ES6+ module, HTML5, CSS3
- **Styling**: Pico CSS v2 framework + custom CSS variables
- **PDF Processing**: PDF.js 4.0.379 for reading, jsPDF 3.0.1 for generation, Canvas API + SVG rendering
- **PWA Features**: Service Worker v6, Web App Manifest, offline-first caching
- **Deployment**: GitHub Pages (static files only, no build process)
- **File Structure**: Flat structure in root directory for deployment simplicity

## Key Technical Constraints
- No build tools, bundlers, or frameworks - pure static files only
- Mobile-first responsive design with touch-friendly interfaces
- All dependencies loaded via CDN (jsDelivr, cdnjs)
- Offline functionality through service worker caching with specific CDN whitelisting
- Performance optimized for mobile devices and slower connections
- SVG-based rendering for precise layout and scalable export quality

## Coding Standards & Conventions

### JavaScript
- Use modern ES6+ features: const/let, arrow functions, async/await, destructuring
- Prefer async/await over Promises for better readability
- Use template literals for string interpolation
- Implement proper error handling with try/catch blocks
- Follow camelCase naming for variables and functions
- Use descriptive variable names that indicate purpose
- Organize code into logical functions with single responsibilities
- Always use semicolons and consistent indentation (2 spaces)

### CSS Architecture
- Use CSS custom properties (CSS variables) defined in :root
- Follow BEM-like naming conventions for classes
- Mobile-first responsive design with progressive enhancement
- Utilize CSS Grid and Flexbox for layouts
- Maintain consistent spacing using CSS variables
- Use meaningful class names that describe function, not appearance
- Leverage Pico CSS classes where possible, custom CSS for specific needs
- Implement smooth transitions and animations for better UX

### HTML Structure
- Semantic HTML5 elements for accessibility
- Progressive Web App best practices (manifest, service worker)
- Touch-friendly button sizes (minimum 44px tap targets)
- Proper ARIA labels for accessibility
- Optimized meta tags for mobile and PWA functionality

## Component Architecture

### Core Components Implemented
- **Sheet Manager**: SVG-based grid layout, cell management, paper size calculations with mm precision
- **PDF Processor**: PDF.js integration for reading with worker configuration, sequential page thumbnail generation
- **File Handlers**: File picker for PDFs/images, PDF page selection with visual thumbnails
- **Rendering System**: Pure SVG rendering with native Canvas API integration for PDF-to-bitmap conversion
- **UI Controllers**: Overlay management with backdrop blur, responsive modal dialogs, FAB interactions
- **Image Manipulation**: Multi-mode image fitting (contain, cover, fill) with pan/zoom for cover mode
- **Touch Interaction**: Single-finger pan, two-finger pinch-to-zoom, wheel zoom for desktop

### Current State Management Pattern
- Object-based state in `layoutState` global variable with nested structure
- Paper size/orientation management with automatic CSS class updates
- Grid configuration with dynamic cell array management
- Cell content storage with image metadata, fill modes, and transform states
- No external state library - pure vanilla JavaScript state handling

## User Experience Patterns
- Floating Action Buttons (FABs) for primary actions (size, grid, export)
- Modal overlays with backdrop blur for complex selections (grid picker, size selector, file type)
- Immediate visual feedback for user interactions with CSS transitions
- Progressive disclosure through multi-step file selection workflow
- Touch-optimized gestures: pan/zoom for image positioning in cover mode
- Click-to-cycle UI pattern for image fill mode switching
- Visual indicators for fill modes with interactive hints
- Graceful loading states with spinner animations and descriptive messages

## Performance Requirements
- Fast initial load time (< 3 seconds on 3G)
- Smooth 60fps animations and transitions
- Efficient memory usage when handling large PDFs
- Progressive loading of PDF pages
- Optimized canvas rendering for export functionality
- Minimal JavaScript bundle size through selective feature loading

## PWA Implementation
- Comprehensive service worker (sw.js v6) for offline functionality
- Cache-first strategy for static assets with specific CDN whitelisting:
  - Pico CSS from cdn.jsdelivr.net
  - PDF.js core and worker from cdn.jsdelivr.net
  - jsPDF from cdnjs.cloudflare.com
- Network-first for dynamic content with offline fallbacks
- Complete manifest.json with SVG icons, screenshots, shortcuts
- Installable on mobile devices with app-like experience
- Background sync capabilities prepared for future export functionality

## Browser Compatibility
- Modern browsers with ES6+ support
- iOS Safari 12+ and Chrome for Android 70+
- Focus on mobile Safari and Chrome primarily
- Graceful degradation for older browsers
- Feature detection over browser detection

## Error Handling Strategy
- User-friendly error messages with actionable guidance
- Graceful fallbacks for unsupported features
- Comprehensive error logging for debugging
- Network error handling with retry mechanisms
- File format validation with clear feedback

## Security Considerations
- Client-side only processing (no server uploads)
- Content Security Policy headers where applicable
- Sanitize any user-generated content
- Secure handling of file operations
- Privacy-first approach with no data collection

## Development Workflow
- Direct file editing without build processes
- Simple GitHub Pages deployment from main branch
- Feature development in isolated functions
- Progressive enhancement approach
- Manual testing on real mobile devices

## File Organization Patterns
- Flat structure in root directory for GitHub Pages deployment
- All source files in root: index.html, main.js, styles.css, sw.js, manifest.json
- No libs/ folder - all dependencies via CDN
- Static PWA assets embedded as data URIs in manifest.json
- Clear separation between UI code and business logic within single main.js file

## Current Implementation Details

### Dependency Management
- Pico CSS v2: https://cdn.jsdelivr.net/npm/@picocss/pico@v2/css/pico.min.css
- PDF.js 4.0.379: core and worker from cdn.jsdelivr.net (ES modules)
- jsPDF 3.0.1: https://cdnjs.cloudflare.com/ajax/libs/jspdf/3.0.1/jspdf.umd.min.js
- Service worker caches specific CDN URLs for offline functionality

### Main Application Structure (main.js)
- **layoutState**: Global state object with sheet{paperSize, orientation, width, height}, grid{cols, rows}, cells[]
- **CONFIG**: Application constants including paperSizes, maxGridSize, pdfWorkerUrl
- **overlayManager**: Utility for showing/hiding modal overlays with backdrop
- **PDF Processing**: PDF.js worker setup, page rendering to canvas/bitmap, thumbnail generation
- **SVG Rendering**: Complete SVG-based sheet rendering with precise mm calculations
- **Touch Interactions**: Pan/zoom for cover mode, single/multi-touch handling

### Key Technical Features Implemented
- SVG-based grid layout system with mm precision (210x297 A4, 297x420 A3)
- Image fill modes: contain (fit), cover (fill+crop+interactive), fill (stretch)
- Interactive transforms for cover mode: scale (0.5-3x), translateX/Y (unlimited)
- Sequential PDF page thumbnail generation with cancellation support
- Canvas-to-bitmap conversion for persistent image storage
- Touch gesture handling: single-finger pan, two-finger pinch-to-zoom
- Keyboard shortcuts: ESC (close overlays), Ctrl/Cmd+E (export)

### State Management Pattern
```javascript
layoutState = {
    sheet: { paperSize: 'A4', orientation: 'portrait', width: 210, height: 297 },
    grid: { cols: 1, rows: 2 },
    cells: [{ image: {src, width, height}, title, fillMode, transform: {scale, translateX, translateY} }]
}
```

### Service Worker (sw.js v6)
- Cache name: 'pdfomator-v6'
- Specific CDN whitelisting for Pico CSS, PDF.js, jsPDF
- Cache-first strategy with network fallback
- HTML fallback for offline navigation
- Background sync preparation for export functionality

### Export System Status
- SVG rendering fully implemented and functional
- Export functionality marked as TODO - needs jsPDF integration
- Canvas-based PDF generation pipeline ready for implementation
- All cell content stored as persistent data URLs for export compatibility

## Code Quality Guidelines
- ES6+ features: const/let, arrow functions, async/await, destructuring, template literals
- Error boundaries with try/catch and global handlers
- User-friendly error messages with actionable guidance
- Consistent camelCase naming and 2-space indentation
- Functions focused on single responsibilities with descriptive names
- Proper event cleanup and memory management (bitmap.close(), removeEventListener)

## Testing Strategy
- Manual testing on target mobile devices (iOS Safari, Chrome Android)
- Cross-browser compatibility testing with ES6+ support
- Large PDF file performance testing with memory optimization
- Offline functionality verification with service worker
- Touch interaction testing for pan/zoom gestures
- File format validation and error handling testing

When working on this project, prioritize the SVG-based rendering system, maintain the mobile-first touch interactions, and ensure all features work offline. The export functionality is the main missing piece - focus on integrating the existing SVG layout with jsPDF for PDF generation.
