import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

const packageJson = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));
const appVersion = packageJson.version;
const largeOcrAssetLimit = 35 * 1024 * 1024;

export default defineConfig({
  base: './',
  define: {
    __PDFOMATOR_VERSION__: JSON.stringify(appVersion)
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  },
  plugins: [
    VitePWA({
      strategies: 'generateSW',
      injectRegister: false,
      manifest: false,
      workbox: {
        cacheId: `pdfomator-${appVersion}`,
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        globPatterns: ['**/*.{css,html,js,json,mjs,svg,tar,wasm}'],
        maximumFileSizeToCacheInBytes: largeOcrAssetLimit,
        navigateFallback: 'index.html'
      }
    })
  ]
});
