---
name: Migrate to Vite Build System
about: Proposal to migrate from zero-build to Vite for better DX and performance
title: '[BUILD] Migrate to Vite Build System'
labels: enhancement, build-system, infrastructure
assignees: ''

---

## 🎯 Summary

Migrate PDFomator from zero-build vanilla JavaScript to Vite build system for improved development experience, performance, and maintainability.

## 📋 Current State

- Pure vanilla JavaScript ES6+ (82KB main.js)
- CDN dependencies (Pico CSS, PDF.js, jsPDF)
- No build tooling or package manager
- Manual service worker with CDN whitelisting

## 💡 Problems

1. **No dependency management** - Manual CDN updates, no version control
2. **Poor dev experience** - No HMR, manual browser refresh
3. **No optimizations** - No code splitting, tree-shaking, or minification
4. **Monolithic code** - Single 82KB file hard to maintain
5. **No testing setup** - Cannot easily add unit/integration tests

## ✨ Proposed Solution

Migrate to Vite with these benefits:

**Development**
- ⚡ Hot Module Replacement (HMR)
- 📦 NPM ecosystem access
- 🧪 Easy testing integration

**Performance**
- 📦 Automatic code splitting
- 🗜️ Minification & tree-shaking
- ~15-25% smaller bundles

**Maintainability**
- 📋 package.json dependency management
- 🔒 Reproducible builds
- 🛡️ Automated security audits

## 🛠️ Implementation Phases

### Phase 1: Setup (Days 1-2)
- [ ] Initialize npm project
- [ ] Install Vite + vite-plugin-pwa
- [ ] Create vite.config.js
- [ ] Set up src/ directory structure

### Phase 2: Migration (Days 3-5)
- [ ] Split main.js into modules (SheetManager, PDFProcessor, etc.)
- [ ] Convert CDN to npm imports
- [ ] Organize CSS files
- [ ] Update all import paths

### Phase 3: PWA (Days 6-7)
- [ ] Configure vite-plugin-pwa
- [ ] Auto-generate service worker
- [ ] Test offline functionality

### Phase 4: Testing (Days 8-10)
- [ ] Verify feature parity
- [ ] Test PWA installation
- [ ] Optimize bundle size
- [ ] Mobile device testing
- [ ] Update deployment workflow

### Phase 5: Documentation (Days 11-12)
- [ ] Update README with build instructions
- [ ] Document new dev workflow
- [ ] Create migration notes

## 📊 Expected Improvements

| Metric | Current | Expected |
|--------|---------|----------|
| Bundle Size | ~82KB | ~60-70KB |
| HTTP Requests | 4-5 | 2-3 |
| Dev Speed | Manual | <100ms HMR |

## 🚧 Key Challenges

1. PDF.js worker path configuration
2. Service worker automation
3. GitHub Pages deployment from dist/
4. Smooth update for existing PWA users
5. Code refactoring (split 82KB file)

## ✅ Success Criteria

- [ ] All features work identically
- [ ] PWA functionality maintained
- [ ] HMR working in development
- [ ] Smaller production bundle
- [ ] GitHub Pages deployment works
- [ ] Mobile performance maintained
- [ ] Build time < 10 seconds

## 💬 Open Questions

1. Introduce TypeScript during migration?
2. Add automated testing (Vitest)?
3. Deployment: GitHub Actions or manual?
4. Single PR or multiple PRs?

## 📖 Resources

- [Vite Documentation](https://vitejs.dev/)
- [vite-plugin-pwa](https://vite-pwa-org.netlify.app/)
- [PDF.js with Vite](https://github.com/mozilla/pdf.js/wiki/Setup-PDF.js-in-a-website#vite)

## ⏱️ Timeline

**Estimated**: 10-12 working days (2 weeks)

---

See [VITE_MIGRATION_PROPOSAL.md](../../VITE_MIGRATION_PROPOSAL.md) for detailed technical proposal.
