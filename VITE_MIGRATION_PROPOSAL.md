# Migration to Vite Build System - Proposal

## 📋 Overview

This proposal outlines the transition of PDFomator from a build-less vanilla JavaScript architecture to a modern Vite-based build system.

## 🎯 Current State

PDFomator currently operates as a **zero-build** Progressive Web App with the following characteristics:

- **Pure vanilla JavaScript** ES6+ modules
- **No build tools** or bundlers
- **CDN dependencies** (Pico CSS, PDF.js, jsPDF)
- **Static file deployment** to GitHub Pages
- **Flat file structure** in root directory
- **Service worker** for offline functionality with CDN whitelisting

### Current Architecture
```
PDFomator/
├── index.html          # Main HTML entry point
├── main.js            # 82KB vanilla JavaScript application
├── styles.css         # 14KB custom styles
├── sw.js              # Service worker for PWA
├── manifest.json      # PWA manifest
└── README.md
```

### Current Dependency Loading
- Pico CSS v2: `https://cdn.jsdelivr.net/npm/@picocss/pico@2/css/pico.red.min.css`
- PDF.js 4.0.379: `https://cdn.jsdelivr.net/npm/pdfjs-dist@4.0.379/...`
- jsPDF 3.0.1: `https://cdnjs.cloudflare.com/ajax/libs/jspdf/3.0.1/jspdf.umd.min.js`

## 💡 Motivation for Migration

### Current Pain Points

1. **Dependency Management**
   - Manual CDN URL management
   - No version control through package.json
   - Service worker must manually whitelist CDN URLs
   - Difficult to update or lock dependency versions
   - No automatic security vulnerability checks

2. **Development Experience**
   - No hot module replacement (HMR)
   - Manual browser refresh required for testing
   - No TypeScript support without manual setup
   - Limited code splitting capabilities
   - No tree-shaking for unused code

3. **Performance Optimization**
   - Large 82KB main.js file loaded entirely
   - No automatic code splitting
   - No build-time optimizations
   - CDN dependencies loaded separately (additional HTTP requests)
   - No minification or compression pipeline

4. **Code Organization**
   - Single 82KB main.js file is difficult to maintain
   - No module system for better organization
   - Harder to implement code reusability
   - Limited ability to use npm packages

5. **Testing Infrastructure**
   - No easy integration with modern testing frameworks
   - Manual testing only
   - No unit test infrastructure

6. **Build Artifacts**
   - Assets must be manually optimized
   - No automatic asset processing pipeline
   - Icons and images embedded as data URIs in manifest

## ✨ Benefits of Vite Migration

### 1. **Development Experience**
- ⚡ **Lightning-fast HMR**: Instant feedback on code changes
- 🔧 **Better DevTools**: Source maps for easier debugging
- 📦 **NPM Package Ecosystem**: Access to thousands of packages
- 🎨 **CSS Preprocessing**: Optional SCSS/LESS support
- 🔍 **TypeScript Ready**: Easy migration to TypeScript if desired

### 2. **Performance Improvements**
- 📦 **Code Splitting**: Automatic chunking for optimal loading
- 🌳 **Tree Shaking**: Remove unused code automatically
- 🗜️ **Minification**: Automatic production optimizations
- 📊 **Bundle Analysis**: Understand and optimize bundle size
- 🚀 **Preloading**: Smart resource preloading strategies

### 3. **Dependency Management**
- 📋 **package.json**: Centralized dependency management
- 🔒 **Lock Files**: Reproducible builds with package-lock.json
- 🔄 **Easy Updates**: Simple dependency version management
- 🛡️ **Security Audits**: Automated vulnerability scanning with npm audit

### 4. **Build Pipeline**
- 🖼️ **Asset Handling**: Automatic optimization of images/fonts
- 🎯 **Environment Variables**: Proper env variable management
- 📝 **Manifest Generation**: Automated PWA manifest creation
- 🔧 **Plugin Ecosystem**: Extensible with Vite plugins

### 5. **Code Quality**
- 🧪 **Testing Integration**: Easy Vitest setup for unit/integration tests
- 📐 **Linting**: ESLint integration
- 🎨 **Formatting**: Prettier integration
- 📊 **Type Checking**: Optional TypeScript support

### 6. **Deployment**
- 🏗️ **Optimized Builds**: Production-ready output
- 📦 **Smaller Bundles**: Better compression and chunking
- 🌐 **Better Caching**: Hashed filenames for cache busting
- 🚀 **GitHub Pages Compatible**: dist folder deployment

## 🛠️ Proposed Architecture

### New Project Structure
```
PDFomator/
├── public/                    # Static assets (not processed)
│   ├── manifest.json         # PWA manifest
│   └── icons/                # App icons
├── src/                      # Source code
│   ├── main.js              # Application entry point
│   ├── components/          # Modular components
│   │   ├── SheetManager.js
│   │   ├── PDFProcessor.js
│   │   ├── FileHandler.js
│   │   └── ExportManager.js
│   ├── utils/               # Utility functions
│   │   ├── imageRotation.js
│   │   ├── touchGestures.js
│   │   └── overlayManager.js
│   ├── styles/              # Organized styles
│   │   ├── main.css
│   │   ├── sheet.css
│   │   └── components.css
│   └── workers/             # Web workers
│       └── sw.js            # Service worker
├── index.html               # HTML entry point
├── vite.config.js          # Vite configuration
├── package.json            # Dependencies and scripts
└── README.md
```

### Dependencies to Add
```json
{
  "dependencies": {
    "@picocss/pico": "^2.0.0",
    "pdfjs-dist": "^4.0.379",
    "jspdf": "^3.0.1"
  },
  "devDependencies": {
    "vite": "^5.0.0",
    "vite-plugin-pwa": "^0.19.0"
  }
}
```

## 📝 Migration Steps

### Phase 1: Setup and Configuration (Day 1-2)
- [ ] Initialize npm project with `npm init`
- [ ] Install Vite and dependencies
- [ ] Create `vite.config.js` with PWA plugin
- [ ] Configure build output for GitHub Pages
- [ ] Set up proper directory structure

### Phase 2: Code Migration (Day 3-5)
- [ ] Move HTML to root (Vite entry point)
- [ ] Create `src/` directory structure
- [ ] Split `main.js` into modular components
- [ ] Convert CDN imports to npm imports
- [ ] Update import paths throughout codebase
- [ ] Migrate styles to organized CSS modules

### Phase 3: PWA Configuration (Day 6-7)
- [ ] Configure vite-plugin-pwa
- [ ] Generate service worker automatically
- [ ] Set up manifest generation
- [ ] Configure offline caching strategy
- [ ] Test PWA functionality

### Phase 4: Testing and Optimization (Day 8-10)
- [ ] Test build process (`npm run build`)
- [ ] Verify all features work as before
- [ ] Test PWA installation
- [ ] Verify offline functionality
- [ ] Optimize bundle size
- [ ] Test on mobile devices
- [ ] Update deployment workflow for GitHub Pages

### Phase 5: Documentation and Cleanup (Day 11-12)
- [ ] Update README with new build instructions
- [ ] Document development workflow
- [ ] Update copilot-instructions.md
- [ ] Create migration notes
- [ ] Archive old deployment files

## ⚙️ Vite Configuration

### Sample `vite.config.js`
```javascript
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/PDFomator/',
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'pdf-libs': ['pdfjs-dist', 'jspdf']
        }
      }
    }
  },
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/*.svg', 'icons/*.png'],
      manifest: {
        name: 'PDFomator',
        short_name: 'PDFomator',
        description: 'Minimal Mobile PWA to Pack PDF Pages on a Sheet',
        theme_color: '#dc2626',
        icons: [
          {
            src: 'icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/cdn\.jsdelivr\.net\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'jsdelivr-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              }
            }
          }
        ]
      }
    })
  ],
  server: {
    port: 3000,
    open: true
  }
});
```

## 🚧 Challenges and Solutions

### Challenge 1: PDF.js Worker Configuration
**Problem**: PDF.js requires worker file path configuration
**Solution**: Use Vite's asset handling to properly reference worker:
```javascript
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.js?url';
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
```

### Challenge 2: Service Worker Integration
**Problem**: Current manual service worker needs automation
**Solution**: Use vite-plugin-pwa for automatic service worker generation with Workbox

### Challenge 3: GitHub Pages Deployment
**Problem**: Vite builds to `dist/` but GitHub Pages expects root
**Solution**: 
- Option A: Configure GitHub Pages to serve from `dist/` folder
- Option B: Add npm script to copy dist to root for deployment
- Option C: Use GitHub Actions to build and deploy

### Challenge 4: Breaking Existing Users
**Problem**: Users may have PWA installed
**Solution**: Maintain same URLs and paths, use service worker update mechanism

### Challenge 5: Large Main.js File
**Problem**: 82KB file needs refactoring
**Solution**: Split into logical modules during migration:
- SheetManager (~15KB)
- PDFProcessor (~20KB)
- ImageManipulation (~15KB)
- ExportManager (~12KB)
- UIControllers (~10KB)
- Utils (~10KB)

## 📊 Expected Improvements

### Build Size
- **Current**: ~82KB main.js + CDN dependencies
- **Expected**: ~60-70KB total (minified + tree-shaken)
- **Improvement**: ~15-25% size reduction

### Load Performance
- **Current**: 4-5 separate CDN requests
- **Expected**: 2-3 optimized chunks
- **Improvement**: Faster initial load with code splitting

### Development Speed
- **Current**: Manual refresh, no HMR
- **Expected**: Instant HMR, <100ms updates
- **Improvement**: 10x faster development iteration

## 🔄 Backward Compatibility

### Maintaining User Experience
- All URLs remain the same
- PWA manifest stays compatible
- Service worker update triggers for existing installations
- Feature parity maintained throughout migration

### Deployment Strategy
- Run both versions in parallel during migration
- A/B test with subset of users
- Gradual rollout through service worker updates

## 📚 Alternative Approaches Considered

### 1. Webpack
- ❌ Slower build times
- ❌ More complex configuration
- ❌ Heavier tooling

### 2. Parcel
- ✅ Zero config
- ❌ Less control over optimization
- ❌ Smaller ecosystem

### 3. esbuild (standalone)
- ✅ Extremely fast
- ❌ Less integrated PWA support
- ❌ More manual configuration needed

### 4. Rollup (standalone)
- ✅ Great for libraries
- ❌ Slower dev experience than Vite
- ❌ More configuration required

**Choice: Vite** - Best balance of speed, DX, and PWA integration

## ✅ Success Criteria

1. ✅ All existing features work identically
2. ✅ PWA functionality maintained (offline, installable)
3. ✅ Faster development with HMR
4. ✅ Smaller production bundle size
5. ✅ Automated dependency management
6. ✅ GitHub Pages deployment works
7. ✅ Mobile performance maintained or improved
8. ✅ Build time under 10 seconds
9. ✅ Tests pass (when test suite is added)
10. ✅ Documentation updated

## 🎯 Timeline

**Estimated Duration**: 10-12 working days

- **Week 1**: Setup, configuration, initial migration
- **Week 2**: Testing, optimization, documentation

**Risk Buffer**: +3 days for unexpected issues

## 📖 Resources

- [Vite Documentation](https://vitejs.dev/)
- [vite-plugin-pwa Documentation](https://vite-pwa-org.netlify.app/)
- [Migrating to Vite Guide](https://vitejs.dev/guide/migration)
- [PDF.js with Vite](https://github.com/mozilla/pdf.js/wiki/Setup-PDF.js-in-a-website#vite)

## 🤝 Next Steps

1. **Review this proposal** with stakeholders
2. **Create GitHub issue** from this document
3. **Prioritize in backlog** against other features
4. **Assign developer** for implementation
5. **Set up milestone** for tracking progress

## 💬 Discussion Points

- Should we introduce TypeScript during migration?
- Should we add automated testing (Vitest) in the same PR?
- What's the preferred deployment strategy?
- Should we split migration into multiple PRs?

---

**Prepared by**: GitHub Copilot Agent
**Date**: January 13, 2026
**Version**: 1.0
