# PDFomator - Copilot Instructions

## Project Overview
PDFomator is a minimal Progressive Web App (PWA) designed for mobile-first usage. The app allows users to arrange PDF pages into customizable grid layouts on different paper sizes (A4, A3) and export the result as a new PDF. The primary use case is combining multiple PDF pages onto a single sheet for printing or presentation purposes.

## Architecture & Technology Stack
- **Frontend**: Vanilla JavaScript (ES6+), HTML5, CSS3
- **Styling**: Pico CSS framework + custom CSS variables
- **PDF Processing**: PDF.js for reading, jsPDF for generation, html2canvas for rendering
- **PWA Features**: Service Worker, Web App Manifest, offline-first design
- **Deployment**: GitHub Pages (static files only, no build process)
- **File Structure**: All source files in root directory for simple deployment

## Key Technical Constraints
- No build tools, bundlers, or frameworks - pure static files only
- Mobile-first responsive design with touch-friendly interfaces
- All dependencies loaded via CDN or included in libs/ folder
- Offline functionality through service worker caching
- Performance optimized for mobile devices and slower connections

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

### Core Components
- **Sheet Manager**: Handles grid layout, cell management, paper size calculations
- **PDF Processor**: PDF.js integration for reading, jsPDF for generation
- **File Handlers**: Drag & drop, file picker, PDF page selection
- **Export System**: Canvas rendering and PDF generation
- **UI Controllers**: Overlay management, responsive dialogs, FAB interactions

### State Management
- Use simple object-based state management
- Maintain state in global variables with clear naming
- Implement state persistence for user preferences
- Handle state updates through dedicated functions

## User Experience Patterns
- Floating Action Buttons (FABs) for primary actions
- Modal overlays for complex selections (grid picker, size selector)
- Immediate visual feedback for user interactions
- Progressive disclosure of advanced features
- Touch-optimized gestures and interactions
- Graceful loading states and error handling

## Performance Requirements
- Fast initial load time (< 3 seconds on 3G)
- Smooth 60fps animations and transitions
- Efficient memory usage when handling large PDFs
- Progressive loading of PDF pages
- Optimized canvas rendering for export functionality
- Minimal JavaScript bundle size through selective feature loading

## PWA Implementation
- Comprehensive service worker for offline functionality
- Cache-first strategy for static assets
- Network-first for dynamic content
- Proper manifest.json with all required properties
- Installable on mobile devices with app-like experience
- Background sync capabilities where appropriate

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
- Flat structure in root directory for GitHub Pages
- Logical grouping of related functions in single files
- External libraries in libs/ folder
- Static assets (icons, manifest) in root
- Clear separation between framework code and app logic

## Code Quality Guidelines
- Write self-documenting code with clear function names
- Add JSDoc comments for complex functions
- Implement comprehensive error boundaries
- Use consistent formatting and indentation
- Avoid deeply nested conditional logic
- Prefer composition over inheritance patterns
- Keep functions small and focused on single tasks

## Testing Strategy
- Manual testing on target mobile devices
- Cross-browser compatibility testing
- Performance testing with large PDF files
- Offline functionality verification
- Touch interaction testing
- Accessibility testing with screen readers

## Documentation Requirements
- Clear README with setup and usage instructions
- Inline code comments for complex logic
- API documentation for major functions
- Deployment and maintenance procedures
- User guide for PWA installation

When working on this project, always consider the mobile-first, offline-capable, and performance-optimized nature of the application. Prioritize simplicity, user experience, and maintainability over complex architectural patterns.
