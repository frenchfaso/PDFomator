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
- **Image Rotation**: Physical 90° clockwise rotation with PNG quality preservation and persistent rotation through mode changes
- **Touch Interaction**: Single-finger pan, two-finger pinch-to-zoom, non-linear wheel zoom (0.2x-5x range) for desktop

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
- 90° clockwise rotation button (yellow ↻ icon) in bottom-left corner of each cell
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
- Comprehensive service worker (sw.js v1.1.0) for offline functionality
- Cache-first strategy for static assets with specific CDN whitelisting:
  - Pico CSS from cdn.jsdelivr.net
  - PDF.js core and worker from cdn.jsdelivr.net
  - jsPDF from cdnjs.cloudflare.com
- Network-first for dynamic content with offline fallbacks
- Complete manifest.json with SVG icons, screenshots, shortcuts
- Installable on mobile devices with app-like experience
- Background sync capabilities prepared for future enhancements

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
- Pico CSS v2: https://cdn.jsdelivr.net/npm/@picocss/pico@2/css/pico.red.min.css
- PDF.js 4.0.379: core and worker from cdn.jsdelivr.net (ES modules)
- jsPDF 3.0.1: https://cdnjs.cloudflare.com/ajax/libs/jspdf/3.0.1/jspdf.umd.min.js
- Service worker caches specific CDN URLs for offline functionality

### Main Application Structure (main.js)
- **layoutState**: Global state object with sheet{paperSize, orientation, width, height}, grid{cols, rows}, cells[]
- **CONFIG**: Application constants including paperSizes, maxGridSize, pdfWorkerUrl
- **EXPORT_QUALITY**: Quality configurations for SD (4.0x scale, 80% JPEG) and HD (6.0x scale, 90% JPEG) exports
- **overlayManager**: Utility for showing/hiding modal overlays with backdrop
- **PDF Processing**: PDF.js worker setup, page rendering to canvas/bitmap, thumbnail generation
- **SVG Rendering**: Complete SVG-based sheet rendering with precise mm calculations
- **Touch Interactions**: Pan/zoom for cover mode, single/multi-touch handling with non-linear zoom
- **Image Rotation**: Physical rotation system with PNG quality preservation
- **Export Pipeline**: Complete jsPDF integration with quality options and canvas rasterization
- **Performance Optimization**: Single cell update system for smooth interactions

### Key Technical Features Implemented
- SVG-based grid layout system with mm precision (210x297 A4, 297x420 A3)
- Image fill modes: contain (fit), cover (fill+crop+interactive), fill (stretch)
- Physical 90° clockwise image rotation with PNG quality preservation throughout manipulation chain
- Interactive transforms for cover mode: scale (0.2x-5x), translateX/Y (unlimited) with non-linear zoom control
- Sequential PDF page thumbnail generation with cancellation support
- Canvas-to-bitmap conversion for persistent image storage
- Touch gesture handling: single-finger pan, two-finger pinch-to-zoom with adaptive zoom steps
- Keyboard shortcuts: ESC (close overlays), Ctrl/Cmd+E (export)
- Quality-based PDF export: Standard (4.0x scale) and HD (6.0x scale) options
- Complete jsPDF integration with canvas rasterization pipeline
- Performance optimization: Single cell updates during interactions to prevent lag

### State Management Pattern
```javascript
layoutState = {
    sheet: { paperSize: 'A4', orientation: 'portrait', width: 210, height: 297 },
    grid: { cols: 1, rows: 2 },
    cells: [{ image: {src, width, height}, title, fillMode, transform: {scale, translateX, translateY} }]
}
```

### Rotation Implementation
- **rotateImageData()**: Physical 90° clockwise rotation using canvas transforms with dimension swapping
- **PNG Pipeline**: Lossless quality preservation throughout all image manipulations until final PDF export
- **UI Integration**: Yellow rotation button (↻) in bottom-left corner of each cell with visual feedback
- **State Management**: Clean transform objects with only scale, translateX, translateY (no rotation field)

### Service Worker (sw.js v1.1.0)
- Cache name: 'pdfomator-v1.1.0'
- Specific CDN whitelisting for Pico CSS, PDF.js, jsPDF
- Cache-first strategy with network fallback
- HTML fallback for offline navigation
- Cache size management to prevent unlimited growth
- Production logging with error/warning levels
- Background sync preparation for future enhancements

### Export System Status
- ✅ **FULLY IMPLEMENTED**: Complete PDF export functionality with jsPDF integration
- ✅ **Quality Options**: Standard (4.0x scale, 80% JPEG compression) and HD (6.0x scale, 90% JPEG compression)
- ✅ **Canvas Rasterization**: Cell-by-cell canvas rendering with precise positioning
- ✅ **SVG to PDF Pipeline**: Complete SVG layout to PDF conversion workflow
- ✅ **Production Ready**: All export features tested and functional
- All cell content stored as persistent data URLs for reliable export compatibility

## Code Quality Guidelines
- ES6+ features: const/let, arrow functions, async/await, destructuring, template literals
- Error boundaries with try/catch and global handlers
- User-friendly error messages with actionable guidance
- Consistent camelCase naming and 2-space indentation
- Functions focused on single responsibilities with descriptive names
- Proper event cleanup and memory management (bitmap.close(), removeEventListener)

## Current Feature Status
- ✅ **Rotation Feature**: Complete with physical 90° clockwise rotation and PNG pipeline
- ✅ **Touch Interactions**: Non-linear zoom control with optimized performance (0.2x-5x range)
- ✅ **Export System**: Full jsPDF integration with quality options working perfectly
- ✅ **Performance**: Single cell updates implemented for smooth multi-cell interactions
- ✅ **Code Quality**: All legacy rotation code removed, clean transform objects
- ✅ **Production Ready**: Comprehensive testing completed, all features stable

## Testing Strategy
- Manual testing on target mobile devices (iOS Safari, Chrome Android)
- Cross-browser compatibility testing with ES6+ support
- Large PDF file performance testing with memory optimization
- Offline functionality verification with service worker
- Touch interaction testing for pan/zoom gestures
- File format validation and error handling testing

When working on this project, prioritize maintaining the SVG-based rendering system, preserve the mobile-first touch interactions, and ensure all features continue to work offline. All core functionality including the new rotation feature is now fully implemented and production-ready. The app has undergone comprehensive testing and code cleanup. Focus on performance optimizations, bug fixes, and user experience improvements rather than major feature additions.

## Key Implementation Notes for Future Development
- **Rotation System**: Always use physical image rotation via `rotateImageData()` - never SVG transforms for rotation
- **PNG Pipeline**: Maintain lossless quality by using PNG format throughout manipulation chain until final export
- **Performance**: Use `updateSingleCell()` for individual cell updates instead of full sheet re-renders
- **Transform Objects**: Keep transform objects clean with only {scale, translateX, translateY} - no rotation field
- **Non-Linear Zoom**: Zoom steps are adaptive based on current scale level for natural user experience
- **Touch Gestures**: Single-finger pan, two-finger pinch-to-zoom with proper touch identifier tracking
