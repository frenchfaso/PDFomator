# Migrate from Zero-Build to Vite Build System

## 🎯 Issue Summary

Migrate PDFomator from a build-less vanilla JavaScript architecture to a modern Vite-based build system to improve development experience, performance, and maintainability.

## 📋 Current State

PDFomator currently operates without any build tooling:
- Pure vanilla JavaScript ES6+ modules (82KB main.js)
- CDN dependencies (Pico CSS, PDF.js, jsPDF)
- Static file deployment to GitHub Pages
- Manual service worker with CDN whitelisting

## 💡 Problem Statement

### Pain Points
1. **No dependency management** - Manual CDN URL updates, no version locking
2. **Poor development experience** - No HMR, manual browser refresh required
3. **Limited optimization** - No code splitting, tree-shaking, or minification
4. **Large monolithic file** - Single 82KB main.js difficult to maintain
5. **No testing infrastructure** - Cannot easily integrate modern test frameworks

## ✨ Proposed Solution

Migrate to Vite build system with the following benefits:

### Development Experience
- ⚡ Lightning-fast Hot Module Replacement (HMR)
- 📦 NPM package ecosystem access
- 🔍 TypeScript support (optional)
- 🧪 Easy testing integration (Vitest)

### Performance
- 📦 Automatic code splitting and tree-shaking
- 🗜️ Production minification and optimization
- 🚀 Smaller bundle sizes (~15-25% reduction)
- 🌐 Better caching with hashed filenames

### Maintainability
- 📋 Centralized dependency management (package.json)
- 🔒 Reproducible builds (package-lock.json)
- 🛡️ Automated security audits (npm audit)
- 🎨 Better code organization with modules

## 🛠️ Implementation Plan

### Phase 1: Setup (Days 1-2)
- [ ] Initialize npm project
- [ ] Install Vite and vite-plugin-pwa
- [ ] Create vite.config.js
- [ ] Set up directory structure

### Phase 2: Migration (Days 3-5)
- [ ] Split main.js into modular components
- [ ] Convert CDN imports to npm packages
- [ ] Migrate styles to organized CSS
- [ ] Update import paths

### Phase 3: PWA (Days 6-7)
- [ ] Configure vite-plugin-pwa
- [ ] Auto-generate service worker
- [ ] Test offline functionality

### Phase 4: Testing (Days 8-10)
- [ ] Verify all features work
- [ ] Test PWA installation
- [ ] Optimize bundle size
- [ ] Test on mobile devices
- [ ] Update GitHub Pages deployment

### Phase 5: Documentation (Days 11-12)
- [ ] Update README
- [ ] Document build workflow
- [ ] Create migration notes

## 📊 Expected Improvements

| Metric | Current | Expected | Improvement |
|--------|---------|----------|-------------|
| Bundle Size | ~82KB | ~60-70KB | 15-25% reduction |
| HTTP Requests | 4-5 CDN | 2-3 chunks | Faster load |
| Dev Iteration | Manual refresh | <100ms HMR | 10x faster |
| Build Time | N/A | <10 seconds | Automated |

## 🚧 Key Challenges

1. **PDF.js Worker**: Need proper worker file path configuration
2. **Service Worker**: Automate with vite-plugin-pwa
3. **GitHub Pages**: Configure deployment from dist folder
4. **User Impact**: Ensure smooth update for installed PWAs
5. **Code Refactoring**: Split 82KB file into logical modules

## ⚙️ Technical Details

### Proposed Structure
```
src/
├── main.js              # Entry point
├── components/          # Modular components
│   ├── SheetManager.js
│   ├── PDFProcessor.js
│   ├── FileHandler.js
│   └── ExportManager.js
├── utils/               # Utilities
└── styles/              # Organized CSS
```

### Dependencies
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

## ✅ Success Criteria

- [ ] All existing features work identically
- [ ] PWA functionality maintained (offline, installable)
- [ ] Faster development with HMR
- [ ] Smaller production bundle
- [ ] Automated dependency management
- [ ] GitHub Pages deployment works
- [ ] Mobile performance maintained/improved
- [ ] Build time under 10 seconds
- [ ] Documentation updated

## 📖 Resources

- [Vite Documentation](https://vitejs.dev/)
- [vite-plugin-pwa](https://vite-pwa-org.netlify.app/)
- [PDF.js with Vite](https://github.com/mozilla/pdf.js/wiki/Setup-PDF.js-in-a-website#vite)

## 🎯 Timeline

**Estimated Duration**: 10-12 working days (2 weeks)

## 💬 Discussion

Questions to address:
1. Should we introduce TypeScript during migration?
2. Should we add automated testing (Vitest) in the same PR?
3. Deployment strategy: GitHub Actions or manual dist deployment?
4. Single PR or split into multiple PRs?

---

**Labels**: enhancement, build-system, infrastructure, PWA
**Priority**: Medium
**Effort**: Large (10-12 days)
