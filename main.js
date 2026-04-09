// PDFomator - Main Application Logic
// ES Module with vanilla JavaScript for PDF page layout

import * as pdfjsLib from './vendor/pdf.mjs';

// Application state
const layoutState = {
    sheet: {
        paperSize: 'A4',
        orientation: 'portrait',
        width: 210, // mm
        height: 297 // mm
    },
    grid: {
        cols: 1,
        rows: 2
    },
    cells: [] // Array of cell contents
};

// Configuration
const CONFIG = {
    paperSizes: {
        A4: { width: 210, height: 297 },
        A3: { width: 297, height: 420 }
    },
    maxGridSize: 5,
    pdfWorkerUrl: './vendor/pdf.worker.mjs',
    
    // Grid spacing constants (in mm)
    gridSpacing: {
        sheetPadding: { top: 10, right: 10, bottom: 10, left: 10 },
        columnGap: 5,
        rowGap: 5,
        cellPadding: 2
    },
    
    // UI constants
    ui: {
        buttonRadius: 12,           // Radius for circular buttons in SVG (mm)
        buttonStrokeWidth: 2,       // Stroke width for buttons (mm)
        buttonIconSize: 8,          // Size of button icons (mm)
        buttonFontSize: 16,         // Font size for button text
        cellStrokeWidth: 0.5,       // Stroke width for cell borders (mm)
        addButtonRadius: 12,        // Radius for add button in empty cells (mm)
        addButtonFontSize: 16       // Font size for add button
    },
    
    // Interaction constants
    interaction: {
        minScale: 0.2,              // Minimum zoom scale
        maxScale: 5,                // Maximum zoom scale
        wheelZoomSlow: 0.01,        // Slow zoom step (zoomed out)
        wheelZoomNormal: 0.05,      // Normal zoom step
        wheelZoomFast: 0.05,        // Fast zoom step (zoomed in)
        pinchDampingZoomedOut: 0.15,// Pinch damping when zoomed out
        pinchDampingNormal: 0.5,    // Normal pinch damping
        pinchDampingZoomedIn: 0.2,  // Pinch damping when zoomed in
        pinchTransitionScale: 1.0,  // Scale where damping transitions (low)
        pinchTransitionScaleHigh: 3.0 // Scale where damping transitions (high)
    },
    
    // Cache management
    cache: {
        updateCheckInterval: 60000  // Check for updates every 60 seconds
    },

    // Image normalization
    image: {
        maxRasterDimension: 2800    // Downscale oversized photos for faster filtering/export
    }
};

// Export quality configuration
const EXPORT_QUALITY = {
    SD: { 
        scale: 4.0,        // Raster scale in px/mm, tuned for the current export pipeline
        jpegQuality: 0.8,
        label: 'Standard (Fast)'
    },
    HD: { 
        scale: 6.0,
        jpegQuality: 0.9,
        label: 'High Quality'
    }
};

const CELL_FILTERS = [
    { key: 'original', label: 'O', name: 'Original' },
    { key: 'document', label: 'A', name: 'Auto' },
    { key: 'bw', label: 'BW', name: 'B&W' },
    { key: 'bitonal', label: '1', name: '1-bit' }
];
const DEFAULT_BITONAL_THRESHOLD = 58;

// Overlay management utilities
const overlayManager = {
    currentOverlay: null,
    previousFocus: null,
    
    show(element, onShow = null) {
        if (!element) return; // Safety check
        element.classList.remove('hidden');
        
        // Store the currently focused element
        this.previousFocus = document.activeElement;
        this.currentOverlay = element;
        
        // Set focus to the overlay or first focusable element
        this.trapFocus(element);
        
        if (onShow) onShow();
    },
    
    hide(element, onHide = null) {
        if (!element) return; // Safety check
        element.classList.add('hidden');
        
        // Restore focus to previous element
        if (this.previousFocus && this.currentOverlay === element) {
            this.previousFocus.focus();
            this.previousFocus = null;
            this.currentOverlay = null;
        }
        
        if (onHide) onHide();
    },
    
    // Trap focus within the overlay
    trapFocus(overlay) {
        // Get all focusable elements
        const focusableElements = overlay.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        if (focusableElements.length === 0) return;
        
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        
        // Focus the first element
        firstElement.focus();
        
        if (overlay._trapFocusHandler) {
            overlay.removeEventListener('keydown', overlay._trapFocusHandler);
        }

        // Handle Tab key to trap focus
        const handleTab = (e) => {
            if (e.key !== 'Tab') return;
            
            if (e.shiftKey) {
                // Shift + Tab
                if (document.activeElement === firstElement) {
                    e.preventDefault();
                    lastElement.focus();
                }
            } else {
                // Tab
                if (document.activeElement === lastElement) {
                    e.preventDefault();
                    firstElement.focus();
                }
            }
        };
        
        overlay._trapFocusHandler = handleTab;
        overlay.addEventListener('keydown', handleTab);
    },
    
    // Setup click-outside-to-close behavior
    setupClickOutside(overlay, hideFunction) {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                hideFunction();
            }
        });
    }
};

// DOM elements
let elements = {};
let currentTargetCell = null; // Track which cell is being filled
let pageSelectorSession = null;
let lastKnownCacheVersion = '';
let statusToastTimeoutId = null;
let activeStatusToast = null;
const filterEngineState = {
    mode: 'pending',
    processor: null,
    unavailableReason: ''
};
const bitonalPopoverState = {
    cellIndex: null,
    anchorRect: null,
    longPressTimer: null,
    suppressNextClick: false,
    frameRequestId: null,
    applying: false,
    pendingThreshold: null
};
const cameraState = {
    stream: null,
    capturedDataUrl: null,
    devices: [],
    selectedDeviceId: ''
};

function beginCellImageOperation(cellData) {
    cellData.imageOperationId = (cellData.imageOperationId || 0) + 1;
    return cellData.imageOperationId;
}

function isCellImageOperationCurrent(cellData, operationId) {
    return !!cellData && cellData.imageOperationId === operationId;
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', init);

// Global error boundary
window.addEventListener('error', (event) => {
    hideLoading(); // Hide any loading states
    alert('An unexpected error occurred. Please refresh the page and try again.');
});

// Global promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
    hideLoading(); // Hide any loading states
    alert('An unexpected error occurred. Please refresh the page and try again.');
    event.preventDefault(); // Prevent the default browser behavior
});

async function init() {
    // Cache DOM elements
    cacheElements();
    
    // Register Service Worker for PWA functionality
    registerServiceWorker();
    
    // Setup PDF.js worker
    await setupPDFWorker();
    warmFilterEngineCapability();
    
    // Initialize the sheet size and grid
    updateSheetSize();
    updateSheetGrid();
    
    // Setup event listeners
    setupEventListeners();
}

function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        let hasReloadedForServiceWorker = false;
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

        navigator.serviceWorker.register('./sw.js')
            .then(registration => {
                console.log('[App] Service Worker registered successfully:', registration.scope);
                
                // Get and display version from service worker
                getServiceWorkerVersion(registration);

                // If an update is already waiting, offer it once.
                if (registration.waiting && !isLocalhost) {
                    console.log('[App] Waiting Service Worker found');
                    showUpdateNotification(registration);
                }
                
                // Check for updates
                registration.addEventListener('updatefound', () => {
                    console.log('[App] Service Worker update found');
                    
                    const newWorker = registration.installing;
                    if (newWorker) {
                        newWorker.addEventListener('statechange', () => {
                            console.log('[App] New Service Worker state:', newWorker.state);
                            
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller && !isLocalhost) {
                                console.log('[App] New version available, waiting for user refresh');
                                showUpdateNotification(registration);
                            }
                        });
                    }
                });
                
                // Skip aggressive polling in local development to avoid noisy update loops.
                if (!isLocalhost) {
                    setInterval(() => {
                        console.log('[App] Checking for updates...');
                        registration.update();
                    }, CONFIG.cache.updateCheckInterval); // Check every minute
                }
                
            })
            .catch(error => {
                console.error('[App] Service Worker registration failed:', error);
            });
            
        // Listen for service worker controller changes
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            if (hasReloadedForServiceWorker) return;
            hasReloadedForServiceWorker = true;

            if (isLocalhost) {
                console.log('[App] Service Worker controller changed on localhost');
                getServiceWorkerVersion();
                return;
            }

            console.log('[App] Service Worker controller changed - reloading app');
            // Reload once after the user applies an update.
            window.location.reload();
        });
    } else {
        console.log('[App] Service Worker not supported');
    }
}

function showUpdateNotification(registration) {
    if (document.querySelector('.update-notification')) {
        return;
    }

    // Create a simple update notification
    const notification = document.createElement('div');
    notification.className = 'update-notification';
    notification.innerHTML = `
        <div class="update-content">
            <span>🔄 App updated! New version available.</span>
            <button id="updateBtn" class="update-btn">Refresh</button>
            <button id="dismissBtn" class="dismiss-btn">×</button>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-dismiss after 10 seconds
    const autoDismiss = setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 10000);
    
    // Handle update button click
    document.getElementById('updateBtn').addEventListener('click', () => {
        clearTimeout(autoDismiss);
        if (registration?.waiting) {
            registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
        notification.remove();
    });
    
    // Handle dismiss button click
    document.getElementById('dismissBtn').addEventListener('click', () => {
        clearTimeout(autoDismiss);
        notification.remove();
    });
    
    console.log('[App] Update notification shown');
}

async function getServiceWorkerVersion(registration = null) {
    console.log('[App] Attempting to get version from service worker');
    
    if (!('serviceWorker' in navigator)) {
        console.log('[App] Service Worker not supported');
        return;
    }

    try {
        const readyRegistration = await navigator.serviceWorker.ready;
        const resolvedRegistration = registration || readyRegistration;
        const serviceWorker = navigator.serviceWorker.controller
            || readyRegistration?.active
            || resolvedRegistration?.active
            || resolvedRegistration?.waiting
            || resolvedRegistration?.installing;

        if (!serviceWorker) {
            console.warn('[App] No service worker available for version lookup');
            return;
        }

        const messageChannel = new MessageChannel();
        
        // Promise to handle the response with timeout
        const versionPromise = new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Timeout waiting for version response'));
            }, 3000);
            
            messageChannel.port1.onmessage = (event) => {
                clearTimeout(timeout);
                resolve(event.data.version);
            };
        });
        
        // Send message to service worker
        serviceWorker.postMessage(
            { type: 'GET_VERSION' },
            [messageChannel.port2]
        );
        
        const version = await versionPromise;
        lastKnownCacheVersion = version;
        console.log('[App] Received version from service worker:', version);
        updateVersionDisplay(version);
    } catch (error) {
        console.warn('[App] Failed to get version from service worker:', error);
    }
}

function updateVersionDisplay(cacheVersion) {
    const versionElement = document.getElementById('version');
    if (versionElement && cacheVersion) {
        // Extract version from cache name (e.g., 'pdfomator-v1.0.2' -> 'v1.0.2')
        lastKnownCacheVersion = cacheVersion;
        const version = cacheVersion.split('-').pop();
        const engineSuffix = filterEngineState.mode === 'gpu' ? 'g' : filterEngineState.mode === 'cpu' ? 'c' : '';
        versionElement.textContent = `${version}${engineSuffix}`;
        console.log('[App] Version displayed:', version);
    } else {
        console.log('[App] Version element not found or no cache version provided');
    }
}

function refreshVersionDisplay() {
    if (lastKnownCacheVersion) {
        updateVersionDisplay(lastKnownCacheVersion);
    }
}

function cacheElements() {
    elements = {
        sheet: document.getElementById('sheet'),
        sizeBtn: document.getElementById('sizeBtn'),
        gridBtn: document.getElementById('gridBtn'),
        exportBtn: document.getElementById('exportBtn'),
        pdfInput: document.getElementById('pdfInput'),
        imageInput: document.getElementById('imageInput'),
        cameraInput: document.getElementById('cameraInput'),
        gridOverlay: document.getElementById('gridOverlay'),
        gridMatrix: document.getElementById('gridMatrix'),
        gridDisplay: document.getElementById('gridDisplay'),
        cancelGrid: document.getElementById('cancelGrid'),
        sizeOverlay: document.getElementById('sizeOverlay'),
        cancelSize: document.getElementById('cancelSize'),
        fileTypeSelector: document.getElementById('fileTypeSelector'),
        selectPdfBtn: document.getElementById('selectPdfBtn'),
        selectImageBtn: document.getElementById('selectImageBtn'),
        selectCameraBtn: document.getElementById('selectCameraBtn'),
        cancelFileType: document.getElementById('cancelFileType'),
        cameraOverlay: document.getElementById('cameraOverlay'),
        cameraDeviceField: document.getElementById('cameraDeviceField'),
        cameraDeviceSelect: document.getElementById('cameraDeviceSelect'),
        cameraVideo: document.getElementById('cameraVideo'),
        cameraCapturedImage: document.getElementById('cameraCapturedImage'),
        cameraCaptureBtn: document.getElementById('cameraCaptureBtn'),
        cameraUseBtn: document.getElementById('cameraUseBtn'),
        cameraRetakeBtn: document.getElementById('cameraRetakeBtn'),
        cancelCamera: document.getElementById('cancelCamera'),
        pageSelector: document.getElementById('pageSelector'),
        pageGrid: document.getElementById('pageGrid'),
        cancelPageSelection: document.getElementById('cancelPageSelection'),
        exportOverlay: document.getElementById('exportOverlay'),
        exportSD: document.getElementById('exportSD'),
        exportHD: document.getElementById('exportHD'),
        cancelExport: document.getElementById('cancelExport'),
        loading: document.getElementById('loading'),
        bitonalPopover: document.getElementById('bitonalPopover'),
        bitonalThresholdSlider: document.getElementById('bitonalThresholdSlider')
    };
}

function showError(message) {
    alert(`PDFomator Error: ${message}`);
}

async function setupPDFWorker() {
    try {
        if (!pdfjsLib?.getDocument || !pdfjsLib?.GlobalWorkerOptions) {
            throw new Error('PDF.js failed to load completely. Please check your internet connection and refresh the page.');
        }

        pdfjsLib.GlobalWorkerOptions.workerSrc = CONFIG.pdfWorkerUrl;
        window.pdfjsLib = pdfjsLib;
        
    } catch (error) {
        // Show user-friendly error
        showError('PDF processing library failed to load. Please check your internet connection and refresh the page.');
    }
}

function warmFilterEngineCapability() {
    if (filterEngineState.mode !== 'pending') {
        refreshVersionDisplay();
        return;
    }

    try {
        getWebGLFilterProcessor();
        setFilterEngineMode('gpu');
    } catch (error) {
        filterEngineState.unavailableReason = String(error);
        setFilterEngineMode('cpu');
    }
}

function setFilterEngineMode(mode) {
    filterEngineState.mode = mode;
    refreshVersionDisplay();
}

function setupEventListeners() {
    // FAB button handlers
    elements.sizeBtn.addEventListener('click', handleSizePicker);
    elements.gridBtn.addEventListener('click', handleGridPicker);
    elements.exportBtn.addEventListener('click', handleExport);
    
    // File input handlers
    elements.pdfInput.addEventListener('change', handlePDFSelection);
    elements.imageInput.addEventListener('change', handleImageSelection);
    elements.cameraInput.addEventListener('change', handleCameraSelection);
    
    // File type selector handlers
    elements.selectPdfBtn.addEventListener('click', () => {
        hideFileTypeSelector();
        elements.pdfInput.click();
    });
    elements.selectImageBtn.addEventListener('click', () => {
        hideFileTypeSelector();
        elements.imageInput.click();
    });
    elements.selectCameraBtn.addEventListener('click', handleCameraOption);
    elements.cancelFileType.addEventListener('click', cancelFileTypeSelector);
    elements.cameraCaptureBtn.addEventListener('click', captureCameraFrame);
    elements.cameraUseBtn.addEventListener('click', useCapturedPhoto);
    elements.cameraRetakeBtn.addEventListener('click', resetCameraCapture);
    elements.cameraDeviceSelect.addEventListener('change', handleCameraDeviceChange);
    elements.cancelCamera.addEventListener('click', cancelCameraOverlay);
    elements.bitonalThresholdSlider.addEventListener('input', handleBitonalThresholdInput);
    
    // Export quality handlers
    elements.exportSD.addEventListener('click', () => handleQualityExport('SD'));
    elements.exportHD.addEventListener('click', () => handleQualityExport('HD'));
    elements.cancelExport.addEventListener('click', hideExportOverlay);
    
    // Cancel button handlers
    elements.cancelGrid.addEventListener('click', hideGridPicker);
    elements.cancelSize.addEventListener('click', hideSizePicker);
    
    // Page selector handlers
    elements.cancelPageSelection.addEventListener('click', hidePageSelector);
    
    // Setup overlay background click handlers
    overlayManager.setupClickOutside(elements.gridOverlay, hideGridPicker);
    overlayManager.setupClickOutside(elements.sizeOverlay, hideSizePicker);
    overlayManager.setupClickOutside(elements.exportOverlay, hideExportOverlay);
    overlayManager.setupClickOutside(elements.fileTypeSelector, cancelFileTypeSelector);
    overlayManager.setupClickOutside(elements.cameraOverlay, cancelCameraOverlay);
    overlayManager.setupClickOutside(elements.pageSelector, hidePageSelector);
    
    // Setup grid matrix
    setupGridMatrix();
    
    // Setup size options
    setupSizeOptions();
    
    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboard);
    document.addEventListener('pointerdown', handleGlobalPointerDown, true);
}

function handleKeyboard(e) {
    // ESC to close overlays
    if (e.key === 'Escape') {
        hideGridPicker();
        hideSizePicker();
        cancelFileTypeSelector();
        cancelCameraOverlay();
        hidePageSelector();
        hideExportOverlay();
        hideLoading();
        hideBitonalPopover();
    }
    
    // Ctrl/Cmd + E to export
    if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault();
        handleExport();
    }
}

function handleSizePicker() {
    showSizePicker();
}

function handleCellAdd(cellIndex) {
    currentTargetCell = cellIndex;
    showFileTypeSelector();
}

function handleGridPicker() {
    showGridPicker();
}

async function handleExport() {
    if (layoutState.cells.filter(cell => cell).length === 0) {
        alert('Please add some content to export!');
        return;
    }
    
    showExportOverlay();
}

async function handlePDFSelection(e) {
    const files = Array.from(e.target.files);
    const targetCell = currentTargetCell; // Store target cell to prevent race conditions
    
    if (files.length === 0 || targetCell === null) return;
    
    const file = files[0]; // Single file selection
    showLoading('Processing PDF...');
    
    try {
        await processPDFFileForCell(file, targetCell);
    } catch (error) {
        alert('Failed to process PDF. Please try again.');
    } finally {
        hideLoading();
        elements.pdfInput.value = '';
        // Only clear currentTargetCell if it still matches our stored value
        if (currentTargetCell === targetCell) {
            currentTargetCell = null;
        }
    }
}

async function handleImageSelection(e) {
    await handleImageLikeSelection(e.target, 'Processing image...', 'Failed to process image. Please try again.');
}

async function handleCameraSelection(e) {
    await handleImageLikeSelection(e.target, 'Processing photo...', 'Failed to process photo. Please try again.');
}

async function handleImageLikeSelection(inputElement, loadingMessage, errorMessage) {
    const files = Array.from(inputElement.files || []);
    const targetCell = currentTargetCell;

    if (files.length === 0 || targetCell === null) {
        inputElement.value = '';
        return;
    }

    showLoading(loadingMessage);

    try {
        await processImageFileForCell(files[0], targetCell);
    } catch (error) {
        alert(errorMessage);
    } finally {
        hideLoading();
        inputElement.value = '';
        if (currentTargetCell === targetCell) {
            currentTargetCell = null;
        }
    }
}

function handleCameraOption() {
    hideFileTypeSelector();

    if (shouldUseNativeCameraCapture()) {
        elements.cameraInput.click();
        return;
    }

    showCameraOverlay();
}

async function processPDFFileForCell(file, cellIndex) {
    if (!pdfjsLib?.getDocument) {
        throw new Error('PDF.js library not loaded. Please refresh the page and try again.');
    }
    
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
    
    if (pdf.numPages === 1) {
        // Imported PDF pages intentionally enter the shared raster image pipeline.
        const page = await pdf.getPage(1);
        const bitmap = await renderPDFPage(page, 2, 'bitmap');
        addToSpecificCell(bitmap, `${file.name} p1`, cellIndex);
    } else {
        // Multiple pages - show page selector
        await showPDFPageSelector(pdf, file.name, cellIndex);
    }
}

async function processImageFileForCell(file, cellIndex) {
    const persistentImg = await createPersistentImageFromFile(file);
    addToSpecificCell(persistentImg, file.name, cellIndex);
}

function shouldUseNativeCameraCapture() {
    const hasCoarsePointer = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
    const hasTouchSupport = navigator.maxTouchPoints > 0;
    const userAgent = navigator.userAgent || '';
    const isMobileUserAgent = /Android|iPhone|iPad|iPod|Mobile/i.test(userAgent);
    const isMobileUAData = navigator.userAgentData?.mobile === true;

    return hasCoarsePointer && hasTouchSupport && (isMobileUserAgent || isMobileUAData);
}

function loadImageFromSrc(src) {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error('Failed to load image data'));
        image.src = src;
    });
}

async function getCachedSourceCanvas(imageData) {
    if (!imageData._sourceCanvasPromise) {
        imageData._sourceCanvasPromise = loadImageFromSrc(imageData.src).then(sourceImage => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = sourceImage.naturalWidth || sourceImage.width;
            canvas.height = sourceImage.naturalHeight || sourceImage.height;

            if (!ctx || !canvas.width || !canvas.height) {
                throw new Error('Failed to cache source image');
            }

            ctx.drawImage(sourceImage, 0, 0);
            return canvas;
        });
    }

    return imageData._sourceCanvasPromise;
}

async function createPersistentImageFromSource(src) {
    const sourceImage = await loadImageFromSrc(src);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    const sourceWidth = sourceImage.naturalWidth || sourceImage.width;
    const sourceHeight = sourceImage.naturalHeight || sourceImage.height;
    const maxDimension = CONFIG.image.maxRasterDimension;
    const shouldDownscale = shouldUseNativeCameraCapture();
    const scale = shouldDownscale ? Math.min(1, maxDimension / Math.max(sourceWidth, sourceHeight)) : 1;

    canvas.width = Math.max(1, Math.round(sourceWidth * scale));
    canvas.height = Math.max(1, Math.round(sourceHeight * scale));

    if (!canvas.width || !canvas.height || !ctx) {
        throw new Error('Failed to prepare image canvas');
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(sourceImage, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/png');

    return loadImageFromSrc(dataUrl);
}

async function createPersistentImageFromFile(file) {
    const objectUrl = URL.createObjectURL(file);

    try {
        return await createPersistentImageFromSource(objectUrl);
    } finally {
        URL.revokeObjectURL(objectUrl);
    }
}

async function createPersistentImageFromDataUrl(dataUrl) {
    return createPersistentImageFromSource(dataUrl);
}

async function renderPDFPage(page, scale = 2, outputFormat = 'canvas') {
    const viewport = page.getViewport({ scale });
    
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    
    await page.render({
        canvasContext: context,
        viewport: viewport
    }).promise;
    
    if (outputFormat === 'bitmap') {
        // Convert to PNG bitmap (lossless, avoid double JPEG compression)
        const dataUrl = canvas.toDataURL('image/png');
        return createPersistentImageFromDataUrl(dataUrl);
    }
    
    return canvas;
}

async function showPDFPageSelector(pdf, fileName, cellIndex) {
    const pageGrid = elements.pageGrid;
    pageGrid.innerHTML = '';
    cancelPDFPageSelectorGeneration();
    
    // Hide the initial loading overlay since we're showing the page selector
    hideLoading();
    
    // Show the page selector immediately
    showPageSelector();
    
    pageSelectorSession = { canceled: false };

    // Start the thumbnail generation process
    generateThumbnailsSequentially(pdf, fileName, cellIndex, pageGrid, pageSelectorSession);
}

async function generateThumbnailsSequentially(pdf, fileName, cellIndex, pageGrid, session) {
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        // Check if generation was canceled before processing each page
        if (session.canceled || pageSelectorSession !== session) {
            return; // Exit the loop immediately
        }
        
        try {
            const page = await pdf.getPage(pageNum);
            const thumbnail = await renderPDFPage(page, 0.5, 'canvas'); // Smaller scale for thumbnails
            
            // Check again after async operations in case user selected during rendering
            if (session.canceled || pageSelectorSession !== session) {
                return;
            }
            
            const pageDiv = document.createElement('div');
            pageDiv.className = 'page-thumbnail';
            pageDiv.dataset.pageNum = pageNum;
            
            const label = document.createElement('div');
            label.className = 'page-label';
            label.textContent = `Page ${pageNum}`;
            
            pageDiv.appendChild(thumbnail);
            pageDiv.appendChild(label);
            
            pageDiv.addEventListener('click', () => {
                // Cancel any ongoing thumbnail generation
                session.canceled = true;
                pageSelectorSession = null;
                
                hidePageSelector();
                showLoading('Processing selected page...');
                
                // Process the selected page immediately
                processSelectedPage(pdf, pageNum, fileName, cellIndex);
            });
            
            pageGrid.appendChild(pageDiv);
            
            // Check if this is the last page
            if (pageGrid.children.length === pdf.numPages) {
                return;
            }
            
        } catch (error) {
            // Check if canceled before creating error placeholder
            if (session.canceled || pageSelectorSession !== session) {
                return;
            }
            
            // Create error placeholder instead of thumbnail
            const pageDiv = document.createElement('div');
            pageDiv.className = 'page-thumbnail';
            pageDiv.dataset.pageNum = pageNum;
            pageDiv.style.backgroundColor = '#f8f9fa';
            pageDiv.style.border = '1px solid #dee2e6';
            pageDiv.style.display = 'flex';
            pageDiv.style.alignItems = 'center';
            pageDiv.style.justifyContent = 'center';
            pageDiv.style.minHeight = '100px';
            
            const errorLabel = document.createElement('div');
            errorLabel.className = 'page-label';
            errorLabel.textContent = `Page ${pageNum} (Error)`;
            errorLabel.style.color = '#dc3545';
            
            pageDiv.appendChild(errorLabel);
            pageGrid.appendChild(pageDiv);
            
            // Check if this was the last page (including errors)
            if (pageGrid.children.length === pdf.numPages) {
                return;
            }
        }
        
        // Yield control back to the browser between pages (for responsiveness)
        await new Promise(resolve => setTimeout(resolve, 0));
    }
}

function cancelPDFPageSelectorGeneration() {
    if (pageSelectorSession) {
        pageSelectorSession.canceled = true;
        pageSelectorSession = null;
    }
}

async function processSelectedPage(pdf, pageNum, fileName, cellIndex) {
    try {
        const selectedPage = await pdf.getPage(pageNum);
        const bitmap = await renderPDFPage(selectedPage, 2, 'bitmap');
        addToSpecificCell(bitmap, `${fileName} p${pageNum}`, cellIndex);
    } catch (error) {
        alert('Failed to process selected page.');
    } finally {
        hideLoading();
    }
}

function addToSpecificCell(content, title = '', cellIndex) {
    const imageData = {
        src: content.src,
        width: content.naturalWidth,
        height: content.naturalHeight
    };

    // Store image data in new format for SVG compatibility
    layoutState.cells[cellIndex] = { 
        image: imageData,
        originalImage: imageData,
        title,
        filter: 'original',
        filterSettings: {
            bitonalThreshold: DEFAULT_BITONAL_THRESHOLD
        },
        imageOperationId: 0,
        fillMode: 'contain', // Default fill mode
        transform: {
            scale: 1,
            translateX: 0,
            translateY: 0
        }
    };
    
    // Re-render entire SVG sheet
    renderSVGSheet();
}

function removeCellContent(cellIndex) {
    if (bitonalPopoverState.cellIndex === cellIndex) {
        hideBitonalPopover();
    }
    layoutState.cells[cellIndex] = null;
    // Re-render entire SVG sheet
    renderSVGSheet();
}

function cycleFillMode(cellIndex) {
    const cellData = layoutState.cells[cellIndex];
    if (!cellData) return;
    
    // SVG native fill mode values to cycle through
    const fillModes = ['contain', 'cover', 'fill'];
    const currentMode = cellData.fillMode || 'contain';
    const currentIndex = fillModes.indexOf(currentMode);
    const nextIndex = (currentIndex + 1) % fillModes.length;
    const nextMode = fillModes[nextIndex];
    
    // Update state
    cellData.fillMode = nextMode;
    
    // Reset transform when switching fill modes
    if (!cellData.transform) {
        cellData.transform = { scale: 1, translateX: 0, translateY: 0 };
    } else {
        cellData.transform.scale = 1;
        cellData.transform.translateX = 0;
        cellData.transform.translateY = 0;
    }
    
    // Re-render entire SVG sheet
    renderSVGSheet();
}

async function cycleCellFilter(cellIndex) {
    const cellData = layoutState.cells[cellIndex];
    if (!cellData?.image) return;

    const currentFilter = cellData.filter || 'original';
    const currentIndex = CELL_FILTERS.findIndex(filter => filter.key === currentFilter);
    const nextFilter = CELL_FILTERS[(currentIndex + 1 + CELL_FILTERS.length) % CELL_FILTERS.length];

    try {
        await applyCellFilter(cellIndex, nextFilter.key);
    } catch (error) {
        console.error('Failed to apply filter:', error);
        alert('Failed to apply filter. Please try again.');
    }
}

async function applyCellFilter(cellIndex, filterKey) {
    const cellData = layoutState.cells[cellIndex];
    if (!cellData?.image) return;

    if (bitonalPopoverState.cellIndex === cellIndex && filterKey !== 'bitonal') {
        hideBitonalPopover();
    }

    const originalImage = cellData.originalImage || cellData.image;
    const operationId = beginCellImageOperation(cellData);
    cellData.originalImage = originalImage;
    cellData.filterSettings = cellData.filterSettings || { bitonalThreshold: DEFAULT_BITONAL_THRESHOLD };
    cellData.filter = filterKey;

    if (filterKey === 'original') {
        if (!isCellImageOperationCurrent(cellData, operationId)) return;
        cellData.image = originalImage;
        updateSingleCell(cellIndex);
        return;
    }

    const filteredImage = await applyWebGLFilterToImage(originalImage, filterKey, cellData.filterSettings);
    if (!isCellImageOperationCurrent(cellData, operationId)) return;

    cellData.image = filteredImage;
    updateSingleCell(cellIndex);
}

// Rotate image 90 degrees clockwise
function rotateImage(cellIndex) {
    const cellData = layoutState.cells[cellIndex];
    if (!cellData?.image) return;
    
    // Ensure transform exists (backward compatibility)
    if (!cellData.transform) {
        cellData.transform = { scale: 1, translateX: 0, translateY: 0 };
    }
    
    const originalImage = cellData.originalImage || cellData.image;
    const operationId = beginCellImageOperation(cellData);

    // Rotate the actual source image data, then rebuild the filtered version.
    rotateImageData(originalImage).then(async rotatedImageData => {
        if (!isCellImageOperationCurrent(cellData, operationId)) return;

        cellData.originalImage = rotatedImageData;
        cellData.filterSettings = cellData.filterSettings || { bitonalThreshold: DEFAULT_BITONAL_THRESHOLD };
        cellData.filter = cellData.filter || 'original';

        if (cellData.filter === 'original') {
            cellData.image = rotatedImageData;
        } else {
            const filteredImage = await applyWebGLFilterToImage(rotatedImageData, cellData.filter, cellData.filterSettings);
            if (!isCellImageOperationCurrent(cellData, operationId)) return;
            cellData.image = filteredImage;
        }

        // Reset transforms since we've physically rotated the image
        cellData.transform.scale = 1;
        cellData.transform.translateX = 0;
        cellData.transform.translateY = 0;
        
        // Re-render the sheet to show the rotation
        renderSVGSheet();
    }).catch(error => {
        console.error('Failed to rotate image:', error);
        alert('Failed to rotate image. Please try again.');
    });
}

// Function to rotate image data 90 degrees clockwise
async function rotateImageData(imageData) {
    return new Promise((resolve, reject) => {
        try {
            // Create a canvas with swapped dimensions (90° rotation)
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Swap width and height for 90° rotation
            canvas.width = imageData.height;
            canvas.height = imageData.width;
            
            // Apply rotation transform
            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.rotate(Math.PI / 2); // 90 degrees in radians
            ctx.translate(-imageData.width / 2, -imageData.height / 2);
            
            // Create image element from existing data
            const img = new Image();
            img.onload = () => {
                try {
                    // Draw the rotated image
                    ctx.drawImage(img, 0, 0, imageData.width, imageData.height);
                    
                    // Convert back to data URL (PNG for lossless quality preservation)
                    const rotatedDataURL = canvas.toDataURL('image/png');
                    
                    // Create new image object with rotated data
                    const rotatedImg = new Image();
                    rotatedImg.onload = () => {
                        resolve({
                            src: rotatedDataURL,
                            width: rotatedImg.naturalWidth,
                            height: rotatedImg.naturalHeight
                        });
                    };
                    rotatedImg.onerror = () => reject(new Error('Failed to create rotated image'));
                    rotatedImg.src = rotatedDataURL;
                    
                } catch (error) {
                    reject(error);
                }
            };
            img.onerror = () => reject(new Error('Failed to load image for rotation'));
            img.src = imageData.src;
            
        } catch (error) {
            reject(error);
        }
    });
}

function getFilterModeValue(filterKey) {
    switch (filterKey) {
        case 'document':
            return 1;
        case 'bw':
            return 2;
        case 'bitonal':
            return 3;
        default:
            return 0;
    }
}

function getBitonalThreshold(cellData) {
    return cellData?.filterSettings?.bitonalThreshold ?? DEFAULT_BITONAL_THRESHOLD;
}

function getCellFilterConfig(filterKey) {
    return CELL_FILTERS.find(filter => filter.key === filterKey) || CELL_FILTERS[0];
}

async function applyWebGLFilterToImage(imageData, filterKey, filterSettings = null) {
    const sourceCanvas = await getCachedSourceCanvas(imageData);

    try {
        const filteredDataUrl = renderFilteredImageWebGL(sourceCanvas, filterKey, filterSettings);
        setFilterEngineMode('gpu');
        return createPersistentImageFromDataUrl(filteredDataUrl);
    } catch (error) {
        console.warn('WebGL filter fallback triggered:', error);
        filterEngineState.unavailableReason = String(error);
        setFilterEngineMode('cpu');
        return renderFilteredImage2D(sourceCanvas, filterKey, filterSettings);
    }
}

function renderFilteredImageWebGL(sourceImage, filterKey, filterSettings = null) {
    const processor = getWebGLFilterProcessor();
    return processor.render(sourceImage, getFilterModeValue(filterKey), (filterSettings?.bitonalThreshold ?? DEFAULT_BITONAL_THRESHOLD) / 100);
}

async function renderFilteredImage2D(sourceImage, filterKey, filterSettings = null) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = sourceImage.naturalWidth || sourceImage.width;
    canvas.height = sourceImage.naturalHeight || sourceImage.height;

    if (!ctx || !canvas.width || !canvas.height) {
        throw new Error('2D canvas unavailable');
    }

    ctx.drawImage(sourceImage, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;

    const bitonalThreshold = (filterSettings?.bitonalThreshold ?? DEFAULT_BITONAL_THRESHOLD) / 100;

    for (let i = 0; i < pixels.length; i += 4) {
        const r = pixels[i] / 255;
        const g = pixels[i + 1] / 255;
        const b = pixels[i + 2] / 255;
        const luma = (r * 0.299) + (g * 0.587) + (b * 0.114);

        let outR = r;
        let outG = g;
        let outB = b;

        if (filterKey === 'document') {
            outR = Math.min(1, Math.max(0, ((r * 0.65 + luma * 0.35) - 0.5) * 1.55 + 0.54));
            outG = Math.min(1, Math.max(0, ((g * 0.65 + luma * 0.35) - 0.5) * 1.55 + 0.54));
            outB = Math.min(1, Math.max(0, ((b * 0.65 + luma * 0.35) - 0.5) * 1.55 + 0.54));
        } else if (filterKey === 'bw') {
            const gray = Math.min(1, Math.max(0, (luma - 0.5) * 1.5 + 0.5));
            outR = gray;
            outG = gray;
            outB = gray;
        } else if (filterKey === 'bitonal') {
            const binary = ((luma - 0.48) * 2.4 + 0.5) >= bitonalThreshold ? 1 : 0;
            outR = binary;
            outG = binary;
            outB = binary;
        }

        pixels[i] = Math.round(outR * 255);
        pixels[i + 1] = Math.round(outG * 255);
        pixels[i + 2] = Math.round(outB * 255);
    }

    ctx.putImageData(imageData, 0, 0);
    return createPersistentImageFromDataUrl(canvas.toDataURL('image/png'));
}

function compileShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const error = gl.getShaderInfoLog(shader);
        gl.deleteShader(shader);
        throw new Error(error || 'Shader compilation failed');
    }

    return shader;
}

function createProgram(gl, vertexShader, fragmentShader) {
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        const error = gl.getProgramInfoLog(program);
        gl.deleteProgram(program);
        throw new Error(error || 'Program linking failed');
    }

    return program;
}

function getWebGLFilterProcessor() {
    if (filterEngineState.processor) {
        return filterEngineState.processor;
    }

    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl', { premultipliedAlpha: false, preserveDrawingBuffer: true });
    if (!gl) {
        throw new Error('WebGL unavailable');
    }

    const vertexShader = compileShader(gl, gl.VERTEX_SHADER, `
        attribute vec2 a_position;
        attribute vec2 a_texCoord;
        varying vec2 v_texCoord;

        void main() {
            gl_Position = vec4(a_position, 0.0, 1.0);
            v_texCoord = a_texCoord;
        }
    `);

    const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, `
        precision mediump float;
        varying vec2 v_texCoord;
        uniform sampler2D u_image;
        uniform float u_filterMode;
        uniform float u_bitonalThreshold;

        float luminance(vec3 color) {
            return dot(color, vec3(0.299, 0.587, 0.114));
        }

        void main() {
            vec4 sampleColor = texture2D(u_image, v_texCoord);
            vec3 color = sampleColor.rgb;
            float luma = luminance(color);

            if (u_filterMode < 0.5) {
                gl_FragColor = sampleColor;
                return;
            }

            if (u_filterMode < 1.5) {
                vec3 balanced = mix(color, vec3(luma), 0.35);
                balanced = clamp((balanced - 0.5) * 1.55 + 0.54, 0.0, 1.0);
                balanced = smoothstep(vec3(0.04), vec3(0.96), balanced);
                gl_FragColor = vec4(balanced, sampleColor.a);
                return;
            }

            if (u_filterMode < 2.5) {
                float gray = clamp((luma - 0.5) * 1.5 + 0.5, 0.0, 1.0);
                gl_FragColor = vec4(vec3(gray), sampleColor.a);
                return;
            }

            float contrasted = clamp((luma - 0.48) * 2.4 + 0.5, 0.0, 1.0);
            float binary = step(u_bitonalThreshold, contrasted);
            gl_FragColor = vec4(vec3(binary), sampleColor.a);
        }
    `);

    const program = createProgram(gl, vertexShader, fragmentShader);
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        -1, -1,
         1, -1,
        -1,  1,
        -1,  1,
         1, -1,
         1,  1
    ]), gl.STATIC_DRAW);

    const texCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        0, 1,
        1, 1,
        0, 0,
        0, 0,
        1, 1,
        1, 0
    ]), gl.STATIC_DRAW);

    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    gl.useProgram(program);

    const positionLocation = gl.getAttribLocation(program, 'a_position');
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    const texCoordLocation = gl.getAttribLocation(program, 'a_texCoord');
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    gl.enableVertexAttribArray(texCoordLocation);
    gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);

    const imageLocation = gl.getUniformLocation(program, 'u_image');
    gl.uniform1i(imageLocation, 0);
    const filterLocation = gl.getUniformLocation(program, 'u_filterMode');
    const bitonalThresholdLocation = gl.getUniformLocation(program, 'u_bitonalThreshold');

    const processor = {
        gl,
        canvas,
        program,
        vertexShader,
        fragmentShader,
        positionBuffer,
        texCoordBuffer,
        texture,
        filterLocation,
        bitonalThresholdLocation,
        render(sourceImage, filterModeValue, bitonalThreshold) {
            const width = sourceImage.width || sourceImage.naturalWidth;
            const height = sourceImage.height || sourceImage.naturalHeight;
            canvas.width = width;
            canvas.height = height;
            gl.viewport(0, 0, width, height);
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, sourceImage);
            gl.uniform1f(filterLocation, filterModeValue);
            gl.uniform1f(bitonalThresholdLocation, bitonalThreshold);
            gl.clearColor(0, 0, 0, 0);
            gl.clear(gl.COLOR_BUFFER_BIT);
            gl.drawArrays(gl.TRIANGLES, 0, 6);
            return canvas.toDataURL('image/png');
        },
        destroy() {
            gl.bindTexture(gl.TEXTURE_2D, null);
            gl.bindBuffer(gl.ARRAY_BUFFER, null);
            gl.useProgram(null);
            gl.deleteTexture(texture);
            gl.deleteBuffer(positionBuffer);
            gl.deleteBuffer(texCoordBuffer);
            gl.deleteProgram(program);
            gl.deleteShader(vertexShader);
            gl.deleteShader(fragmentShader);
        }
    };

    canvas.addEventListener('webglcontextlost', () => {
        filterEngineState.processor = null;
        setFilterEngineMode('cpu');
    }, { once: true });

    filterEngineState.processor = processor;
    return processor;
}

// Interactive image transform functions for cover mode
function setupImageInteraction(imageEl, cellIndex, cellBounds) {
    try {
        const cellData = layoutState.cells[cellIndex];
        if (!cellData || cellData.fillMode !== 'cover') return;
        
        // Ensure transform exists (backward compatibility)
        if (!cellData.transform) {
            cellData.transform = { scale: 1, translateX: 0, translateY: 0 };
        }
        
        let isInteracting = false;
        let startTouches = [];
        let startTransform = { ...cellData.transform };
        
        // Handle click for desktop fill mode cycling
        imageEl.addEventListener('click', (e) => {
            e.stopPropagation();
            // Only handle click on desktop (no touch support)
            if (!('ontouchstart' in window) && !isInteracting) {
                cycleFillMode(cellIndex);
            }
        });
        
        // Mouse events for desktop
        imageEl.addEventListener('mousedown', startInteraction);
        imageEl.addEventListener('wheel', handleWheel, { passive: false });
        
        // Touch events for mobile - simplified
        imageEl.addEventListener('touchstart', handleTouchStart, { passive: false });
        imageEl.addEventListener('touchmove', handleTouchMove, { passive: false });
        imageEl.addEventListener('touchend', handleTouchEnd, { passive: false });
        imageEl.addEventListener('touchcancel', handleTouchEnd, { passive: false });
    
    function handleTouchStart(e) {
        e.preventDefault();
        e.stopPropagation();
        
        isInteracting = true;
        
        startTouches = Array.from(e.touches).map(touch => ({
            x: touch.clientX,
            y: touch.clientY,
            identifier: touch.identifier
        }));
        
        // Capture the current transform state at the start of interaction
        startTransform = { ...cellData.transform };
    }
    
    function handleTouchMove(e) {
        e.preventDefault();
        e.stopPropagation();
        
        if (!isInteracting) return;
        
        const currentTouches = Array.from(e.touches);
        
        if (currentTouches.length === 1 && startTouches.length === 1) {
            // Single finger pan
            const startTouch = startTouches[0];
            const currentTouch = currentTouches.find(touch => touch.identifier === startTouch.identifier) || currentTouches[0];
            
            const deltaX = currentTouch.clientX - startTouch.x;
            const deltaY = currentTouch.clientY - startTouch.y;
            
            updateTransform(deltaX, deltaY, 1);
            
        } else if (currentTouches.length === 2 && startTouches.length >= 1) {
            // Two finger pinch-to-zoom
            if (startTouches.length === 1) {
                // We started with one finger, now have two - update start touches
                startTouches = Array.from(e.touches).map(touch => ({
                    x: touch.clientX,
                    y: touch.clientY,
                    identifier: touch.identifier
                }));
                startTransform = { ...cellData.transform };
                return;
            }
            
            // Match touches by identifier
            const currentTouch1 = currentTouches.find(touch => touch.identifier === startTouches[0].identifier);
            const currentTouch2 = currentTouches.find(touch => touch.identifier === startTouches[1].identifier);
            
            if (currentTouch1 && currentTouch2 && startTouches.length >= 2) {
                const startDistance = getDistance(startTouches[0], startTouches[1]);
                const currentDistance = getDistance(
                    { x: currentTouch1.clientX, y: currentTouch1.clientY },
                    { x: currentTouch2.clientX, y: currentTouch2.clientY }
                );
                const scaleChange = currentDistance / startDistance;
                
                // Get center point of the gesture
                const startCenter = getCenter(startTouches[0], startTouches[1]);
                const currentCenter = getCenter(
                    { x: currentTouch1.clientX, y: currentTouch1.clientY },
                    { x: currentTouch2.clientX, y: currentTouch2.clientY }
                );
                const deltaX = currentCenter.x - startCenter.x;
                const deltaY = currentCenter.y - startCenter.y;
                
                updateTransform(deltaX, deltaY, scaleChange);
            }
        }
    }
    
    function handleTouchEnd(e) {
        e.preventDefault();
        e.stopPropagation();
        
        // If all touches are gone, end interaction
        if (e.touches.length === 0) {
            isInteracting = false;
            startTouches = [];
        } else if (e.touches.length < startTouches.length) {
            // Some touches lifted, update the remaining touches as new start
            startTouches = Array.from(e.touches).map(touch => ({
                x: touch.clientX,
                y: touch.clientY,
                identifier: touch.identifier
            }));
            startTransform = { ...cellData.transform };
        }
    }
    
    function startInteraction(e) {
        e.preventDefault();
        e.stopPropagation();
        
        isInteracting = true;
        startTouches = [{ x: e.clientX, y: e.clientY }];
        startTransform = { ...cellData.transform };
        
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', endInteraction);
    }
    
    function handleMouseMove(e) {
        if (!isInteracting || startTouches.length !== 1) return;
        
        const deltaX = e.clientX - startTouches[0].x;
        const deltaY = e.clientY - startTouches[0].y;
        
        updateTransform(deltaX, deltaY, 1);
    }
    
    function endInteraction() {
        isInteracting = false;
        startTouches = [];
        
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', endInteraction);
    }
    
    function handleWheel(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const currentScale = cellData.transform.scale;
        
        // Non-linear zoom that slows down at extremes
        // Use different acceleration based on current zoom level
        let zoomStep;
        if (currentScale < CONFIG.interaction.pinchTransitionScale) {
            // Much slower zoom when zoomed out (0.2 - 1.0) for precise control
            zoomStep = CONFIG.interaction.wheelZoomSlow + (currentScale - CONFIG.interaction.minScale) * 0.025;
        } else if (currentScale > CONFIG.interaction.pinchTransitionScaleHigh) {
            // Much slower zoom when highly zoomed in (3.0 - 5.0)
            zoomStep = CONFIG.interaction.wheelZoomNormal - (currentScale - CONFIG.interaction.pinchTransitionScaleHigh) * 0.015;
        } else {
            // Normal zoom in the middle range (1.0 - 3.0)
            zoomStep = CONFIG.interaction.wheelZoomNormal;
        }
        
        const direction = e.deltaY < 0 ? 1 : -1;
        const newScale = Math.max(CONFIG.interaction.minScale, Math.min(CONFIG.interaction.maxScale, currentScale + (direction * zoomStep)));
        
        cellData.transform.scale = newScale;
        
        // Only update the specific cell, not the entire sheet
        updateSingleCell(cellIndex);
    }
    
    function updateTransform(deltaX, deltaY, scaleChange) {
        try {
            // Convert screen coordinates to SVG coordinates
            const svg = elements.sheet.querySelector('svg');
            if (!svg) return;
            
            const rect = svg.getBoundingClientRect();
            const svgDeltaX = (deltaX / rect.width) * layoutState.sheet.width;
            const svgDeltaY = (deltaY / rect.height) * layoutState.sheet.height;
            
            // Apply non-linear scaling similar to wheel zoom for pinch gestures
            let newScale;
            if (scaleChange !== 1) {
                // For pinch gestures, convert multiplicative change to additive with non-linear steps
                const currentScale = startTransform.scale;
                const scaleDelta = (scaleChange - 1) * currentScale;
                
                // Apply non-linear damping based on current zoom level
                let dampingFactor;
                if (currentScale < CONFIG.interaction.pinchTransitionScale) {
                    // Much slower scaling when zoomed out for precise control
                    dampingFactor = CONFIG.interaction.pinchDampingZoomedOut + (currentScale - CONFIG.interaction.minScale) * 0.25;
                } else if (currentScale > CONFIG.interaction.pinchTransitionScaleHigh) {
                    // Much slower scaling when highly zoomed in
                    dampingFactor = CONFIG.interaction.pinchDampingNormal - (currentScale - CONFIG.interaction.pinchTransitionScaleHigh) * 0.15;
                } else {
                    // Normal scaling in middle range
                    dampingFactor = CONFIG.interaction.pinchDampingNormal;
                }
                
                newScale = Math.max(CONFIG.interaction.minScale, Math.min(CONFIG.interaction.maxScale, currentScale + (scaleDelta * dampingFactor)));
            } else {
                newScale = startTransform.scale;
            }
            
            const newTranslateX = startTransform.translateX + svgDeltaX;
            const newTranslateY = startTransform.translateY + svgDeltaY;
            
            // Update transform
            cellData.transform = {
                scale: newScale,
                translateX: newTranslateX,
                translateY: newTranslateY
            };
            
            // Only update the specific cell, not the entire sheet
            updateSingleCell(cellIndex);
        } catch (error) {
            console.error('Cover mode: Error updating transform', error);
        }
    }
    
    function getDistance(touch1, touch2) {
        const dx = touch2.x - touch1.x;
        const dy = touch2.y - touch1.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    function getCenter(touch1, touch2) {
        return {
            x: (touch1.x + touch2.x) / 2,
            y: (touch1.y + touch2.y) / 2
        };
    }
    } catch (error) {
        // Silently handle setup errors
    }
}

// Efficient single cell update function for smooth interactions
function updateSingleCell(cellIndex) {
    const svg = elements.sheet.querySelector('svg');
    if (!svg) {
        // Fallback to full render if SVG doesn't exist
        renderSVGSheet();
        return;
    }
    
    const contentLayer = svg.querySelector('#content-layer');
    const uiLayer = svg.querySelector('#ui-layer');
    
    if (!contentLayer || !uiLayer) {
        // Fallback to full render if layers don't exist
        renderSVGSheet();
        return;
    }

    const { gridSpacing } = getGridMetrics();
    const { x: cellX, y: cellY, width: cellWidth, height: cellHeight } = getCellCoordinates(cellIndex);
    
    // Find and remove existing cell elements
    const existingContentCell = contentLayer.querySelector(`[data-cell-index="${cellIndex}"]`);
    const existingUICell = uiLayer.querySelector(`[data-cell-index="${cellIndex}"]`);
    
    if (existingContentCell) existingContentCell.remove();
    if (existingUICell) existingUICell.remove();
    
    // Create new cell groups
    const cellContentGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    cellContentGroup.setAttribute('data-cell-index', cellIndex);
    cellContentGroup.setAttribute('class', 'cell-content');
    
    const cellUIGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    cellUIGroup.setAttribute('data-cell-index', cellIndex);
    cellUIGroup.setAttribute('class', 'cell-ui');
    cellUIGroup.style.cursor = 'pointer';
    
    // Render the updated cell
    renderSVGCell(cellContentGroup, cellUIGroup, cellIndex, cellX, cellY, cellWidth, cellHeight, gridSpacing.cellPadding);

    // Match the behavior of the full SVG render.
    cellUIGroup.addEventListener('click', () => handleCellAdd(cellIndex));
    
    // Add back to DOM
    contentLayer.appendChild(cellContentGroup);
    uiLayer.appendChild(cellUIGroup);
}

function updateSheetSize() {
    const { paperSize, orientation } = layoutState.sheet;
    const size = CONFIG.paperSizes[paperSize];
    
    // Update dimensions in state
    if (orientation === 'portrait') {
        layoutState.sheet.width = size.width;
        layoutState.sheet.height = size.height;
    } else {
        layoutState.sheet.width = size.height;
        layoutState.sheet.height = size.width;
    }
    
    // Update CSS classes directly on the sheet element
    elements.sheet.className = `sheet ${paperSize.toLowerCase()}-${orientation}`;
    
    // Re-render SVG if it exists
    if (elements.sheet.querySelector('svg')) {
        renderSVGSheet();
    }
}

// SVG cell rendering function
function renderSVGCell(cellContentGroup, cellUIGroup, cellIndex, cellX, cellY, cellWidth, cellHeight, cellPadding) {
    const cellData = layoutState.cells[cellIndex];
    
    if (cellData?.image) {
        const imgX = cellX + cellPadding;
        const imgY = cellY + cellPadding;
        const imgWidth = cellWidth - (cellPadding * 2);
        const imgHeight = cellHeight - (cellPadding * 2);
        
        // Create clipping path for the cell content area
        const clipId = `cell-clip-${cellIndex}`;
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        const clipPath = document.createElementNS('http://www.w3.org/2000/svg', 'clipPath');
        clipPath.setAttribute('id', clipId);
        
        const clipRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        clipRect.setAttribute('x', imgX);
        clipRect.setAttribute('y', imgY);
        clipRect.setAttribute('width', imgWidth);
        clipRect.setAttribute('height', imgHeight);
        clipPath.appendChild(clipRect);
        defs.appendChild(clipPath);
        cellContentGroup.appendChild(defs);
        
        // Create image element with different handling for cover mode
        const imageEl = document.createElementNS('http://www.w3.org/2000/svg', 'image');
        imageEl.setAttribute('href', cellData.image.src);
        imageEl.setAttribute('clip-path', `url(#${clipId})`);
        imageEl.style.cursor = 'pointer';
        
        if (cellData.fillMode === 'cover') {
            // For cover mode, implement custom scaling and positioning with transforms
            const transform = cellData.transform || { scale: 1, translateX: 0, translateY: 0 };
            
            // Use the current image dimensions (already rotated if needed)
            const imageAspect = cellData.image.width / cellData.image.height;
            const cellAspect = imgWidth / imgHeight;
            
            let baseWidth, baseHeight;
            if (imageAspect > cellAspect) {
                // Image is wider than cell - scale to fill height
                baseHeight = imgHeight;
                baseWidth = baseHeight * imageAspect;
            } else {
                // Image is taller than cell - scale to fill width
                baseWidth = imgWidth;
                baseHeight = baseWidth / imageAspect;
            }
            
            // Apply user transforms
            const finalWidth = baseWidth * transform.scale;
            const finalHeight = baseHeight * transform.scale;
            
            // Center the image in the cell and apply user translation
            const centerX = imgX + imgWidth / 2;
            const centerY = imgY + imgHeight / 2;
            const finalX = centerX - finalWidth / 2 + transform.translateX;
            const finalY = centerY - finalHeight / 2 + transform.translateY;
            
            imageEl.setAttribute('x', finalX);
            imageEl.setAttribute('y', finalY);
            imageEl.setAttribute('width', finalWidth);
            imageEl.setAttribute('height', finalHeight);
            imageEl.setAttribute('preserveAspectRatio', 'none'); // We handle aspect ratio manually
            
            // Setup interactive behavior for cover mode
            setupImageInteraction(imageEl, cellIndex, { x: imgX, y: imgY, width: imgWidth, height: imgHeight });
            
        } else {
            // Standard behavior for contain and fill modes
            const preserveAspectRatioMap = {
                'contain': 'xMidYMid meet',    // Scale to fit entirely within cell
                'fill': 'none'                 // Stretch to fill entire cell
            };
            
            imageEl.setAttribute('x', imgX);
            imageEl.setAttribute('y', imgY);
            imageEl.setAttribute('width', imgWidth);
            imageEl.setAttribute('height', imgHeight);
            imageEl.setAttribute('preserveAspectRatio', preserveAspectRatioMap[cellData.fillMode] || preserveAspectRatioMap['contain']);
            
            // Add click handler for cycling fill mode
            imageEl.addEventListener('click', (e) => {
                e.stopPropagation();
                cycleFillMode(cellIndex);
            });
        }
        
        cellContentGroup.appendChild(imageEl);
        
        // Add fill mode cycling button (circle with square icon in top-left corner, inside cell)
        const fillModeBtn = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        fillModeBtn.style.cursor = 'pointer';
        
        const fillModeBtnCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        fillModeBtnCircle.setAttribute('cx', cellX + CONFIG.ui.buttonRadius);
        fillModeBtnCircle.setAttribute('cy', cellY + CONFIG.ui.buttonRadius);
        fillModeBtnCircle.setAttribute('r', CONFIG.ui.buttonRadius);
        fillModeBtnCircle.setAttribute('fill', 'rgba(40, 167, 69, 0.9)');
        fillModeBtnCircle.setAttribute('stroke', 'white');
        fillModeBtnCircle.setAttribute('stroke-width', CONFIG.ui.buttonStrokeWidth);
        
        // Simple white square outline icon (larger)
        const fillModeBtnIcon = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        fillModeBtnIcon.setAttribute('x', cellX + CONFIG.ui.buttonRadius - CONFIG.ui.buttonIconSize / 2);
        fillModeBtnIcon.setAttribute('y', cellY + CONFIG.ui.buttonRadius - CONFIG.ui.buttonIconSize / 2);
        fillModeBtnIcon.setAttribute('width', CONFIG.ui.buttonIconSize);
        fillModeBtnIcon.setAttribute('height', CONFIG.ui.buttonIconSize);
        fillModeBtnIcon.setAttribute('fill', 'none');
        fillModeBtnIcon.setAttribute('stroke', 'white');
        fillModeBtnIcon.setAttribute('stroke-width', CONFIG.ui.buttonStrokeWidth);
        
        fillModeBtn.appendChild(fillModeBtnCircle);
        fillModeBtn.appendChild(fillModeBtnIcon);
        
        // Add click handler for fill mode cycling button
        fillModeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            cycleFillMode(cellIndex);
        });
        
        cellUIGroup.appendChild(fillModeBtn);

        const filterConfig = getCellFilterConfig(cellData.filter || 'original');
        const filterBtn = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        filterBtn.style.cursor = 'pointer';
        filterBtn.setAttribute('data-control', 'filter');

        const filterBtnCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        filterBtnCircle.setAttribute('cx', cellX + cellWidth / 2);
        filterBtnCircle.setAttribute('cy', cellY + 12);
        filterBtnCircle.setAttribute('r', '12');
        filterBtnCircle.setAttribute('fill', 'rgba(111, 66, 193, 0.92)');
        filterBtnCircle.setAttribute('stroke', 'white');
        filterBtnCircle.setAttribute('stroke-width', '2');

        const filterBtnText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        filterBtnText.setAttribute('x', cellX + cellWidth / 2);
        filterBtnText.setAttribute('y', cellY + 12);
        filterBtnText.setAttribute('text-anchor', 'middle');
        filterBtnText.setAttribute('dominant-baseline', 'central');
        filterBtnText.setAttribute('font-family', 'monospace');
        filterBtnText.setAttribute('font-size', filterConfig.label.length > 1 ? '10' : '13');
        filterBtnText.setAttribute('fill', 'white');
        filterBtnText.setAttribute('font-weight', 'bold');
        filterBtnText.textContent = filterConfig.label;

        filterBtn.appendChild(filterBtnCircle);
        filterBtn.appendChild(filterBtnText);
        filterBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (bitonalPopoverState.suppressNextClick) {
                bitonalPopoverState.suppressNextClick = false;
                return;
            }
            cycleCellFilter(cellIndex);
        });
        bindBitonalPopoverTriggers(filterBtn, cellIndex);

        cellUIGroup.appendChild(filterBtn);
        
        // Add remove button (circle with X in top-right corner, inside cell)
        const removeBtn = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        removeBtn.style.cursor = 'pointer';
        
        const removeBtnCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        removeBtnCircle.setAttribute('cx', cellX + cellWidth - 12);
        removeBtnCircle.setAttribute('cy', cellY + 12);
        removeBtnCircle.setAttribute('r', '12');
        removeBtnCircle.setAttribute('fill', 'rgba(220, 53, 69, 0.9)');
        removeBtnCircle.setAttribute('stroke', 'white');
        removeBtnCircle.setAttribute('stroke-width', '2');
        
        const removeBtnText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        removeBtnText.setAttribute('x', cellX + cellWidth - 12);
        removeBtnText.setAttribute('y', cellY + 12);
        removeBtnText.setAttribute('text-anchor', 'middle');
        removeBtnText.setAttribute('dominant-baseline', 'central');
        removeBtnText.setAttribute('font-family', 'monospace');
        removeBtnText.setAttribute('font-size', '16');
        removeBtnText.setAttribute('fill', 'white');
        removeBtnText.setAttribute('font-weight', 'bold');
        removeBtnText.textContent = '×';
        
        removeBtn.appendChild(removeBtnCircle);
        removeBtn.appendChild(removeBtnText);
        
        // Add click handler for remove button
        removeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            removeCellContent(cellIndex);
        });
        
        cellUIGroup.appendChild(removeBtn);
        
        // Add rotation button (circle with rotate icon in bottom-left corner, inside cell)
        const rotateBtn = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        rotateBtn.style.cursor = 'pointer';
        
        const rotateBtnCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        rotateBtnCircle.setAttribute('cx', cellX + 12);
        rotateBtnCircle.setAttribute('cy', cellY + cellHeight - 12);
        rotateBtnCircle.setAttribute('r', '12');
        rotateBtnCircle.setAttribute('fill', 'rgba(255, 193, 7, 0.9)'); // Yellow/orange color
        rotateBtnCircle.setAttribute('stroke', 'white');
        rotateBtnCircle.setAttribute('stroke-width', '2');
        
        // Rotation arrow icon (⟲ Unicode character)
        const rotateBtnText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        rotateBtnText.setAttribute('x', cellX + 12);
        rotateBtnText.setAttribute('y', cellY + cellHeight - 12);
        rotateBtnText.setAttribute('text-anchor', 'middle');
        rotateBtnText.setAttribute('dominant-baseline', 'central');
        rotateBtnText.setAttribute('font-family', 'monospace');
        rotateBtnText.setAttribute('font-size', '14');
        rotateBtnText.setAttribute('fill', 'white');
        rotateBtnText.setAttribute('font-weight', 'bold');
        rotateBtnText.textContent = '↻';
        
        rotateBtn.appendChild(rotateBtnCircle);
        rotateBtn.appendChild(rotateBtnText);
        
        // Add click handler for rotation button
        rotateBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            rotateImage(cellIndex);
        });
        
        cellUIGroup.appendChild(rotateBtn);
        
        // Add reset button for cover mode (circle with reset icon in bottom-right corner, inside cell)
        if (cellData.fillMode === 'cover') {
            const resetBtn = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            resetBtn.style.cursor = 'pointer';
            
            const resetBtnCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            resetBtnCircle.setAttribute('cx', cellX + cellWidth - 12);
            resetBtnCircle.setAttribute('cy', cellY + cellHeight - 12);
            resetBtnCircle.setAttribute('r', '12');
            resetBtnCircle.setAttribute('fill', 'rgba(13, 110, 253, 0.9)');
            resetBtnCircle.setAttribute('stroke', 'white');
            resetBtnCircle.setAttribute('stroke-width', '2');
            
            const resetBtnText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            resetBtnText.setAttribute('x', cellX + cellWidth - 12);
            resetBtnText.setAttribute('y', cellY + cellHeight - 12);
            resetBtnText.setAttribute('text-anchor', 'middle');
            resetBtnText.setAttribute('dominant-baseline', 'central');
            resetBtnText.setAttribute('font-family', 'monospace');
            resetBtnText.setAttribute('font-size', '14');
            resetBtnText.setAttribute('fill', 'white');
            resetBtnText.setAttribute('font-weight', 'bold');
            resetBtnText.textContent = '←';
            
            resetBtn.appendChild(resetBtnCircle);
            resetBtn.appendChild(resetBtnText);
            
            // Add click handler for reset button
            resetBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                // Reset transform to default values
                cellData.transform = { scale: 1, translateX: 0, translateY: 0 };
                renderSVGSheet();
            });
            
            cellUIGroup.appendChild(resetBtn);
        }
        
    } else {
        // Empty cell - add cell background for visual reference
        const cellRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        cellRect.setAttribute('x', cellX);
        cellRect.setAttribute('y', cellY);
        cellRect.setAttribute('width', cellWidth);
        cellRect.setAttribute('height', cellHeight);
        cellRect.setAttribute('fill', '#f8f9fa');
        cellRect.setAttribute('stroke', '#dee2e6');
        cellRect.setAttribute('stroke-width', '0.5');
        cellUIGroup.appendChild(cellRect);
        
        // Empty cell - add subtle "+" button
        const addBtn = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        addBtn.style.cursor = 'pointer';
        
        const addBtnCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        addBtnCircle.setAttribute('cx', cellX + cellWidth / 2);
        addBtnCircle.setAttribute('cy', cellY + cellHeight / 2);
        addBtnCircle.setAttribute('r', '12'); // Bigger than control buttons
        addBtnCircle.setAttribute('fill', 'rgba(173, 181, 189, 0.3)'); // Light gray, barely visible
        addBtnCircle.setAttribute('stroke', 'rgba(173, 181, 189, 0.5)');
        addBtnCircle.setAttribute('stroke-width', '1');
        
        const addBtnText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        addBtnText.setAttribute('x', cellX + cellWidth / 2);
        addBtnText.setAttribute('y', cellY + cellHeight / 2);
        addBtnText.setAttribute('text-anchor', 'middle');
        addBtnText.setAttribute('dominant-baseline', 'central');
        addBtnText.setAttribute('font-family', 'monospace');
        addBtnText.setAttribute('font-size', '16');
        addBtnText.setAttribute('fill', 'rgba(173, 181, 189, 0.7)');
        addBtnText.setAttribute('font-weight', 'normal');
        addBtnText.textContent = '+';
        
        addBtn.appendChild(addBtnCircle);
        addBtn.appendChild(addBtnText);
        
        cellUIGroup.appendChild(addBtn);
    }
}

// SVG-based sheet rendering function
function renderSVGSheet() {
    const { width, height, totalCells, gridSpacing } = getGridMetrics();
    
    // Clear the sheet container
    elements.sheet.innerHTML = '';
    
    // Create SVG element with mm dimensions
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    svg.style.border = '1px solid #ccc';
    svg.style.background = 'white';
    
    // Create content layer (for export)
    const contentLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    contentLayer.setAttribute('id', 'content-layer');
    
    // Create UI layer (hidden during export)
    const uiLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    uiLayer.setAttribute('id', 'ui-layer');
    
    // Add sheet background to content layer
    const sheetBg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    sheetBg.setAttribute('x', '0');
    sheetBg.setAttribute('y', '0');
    sheetBg.setAttribute('width', width);
    sheetBg.setAttribute('height', height);
    sheetBg.setAttribute('fill', 'white');
    sheetBg.setAttribute('stroke', '#ddd');
    sheetBg.setAttribute('stroke-width', '0.5');
    contentLayer.appendChild(sheetBg);
    
    // Render each cell
    for (let i = 0; i < totalCells; i++) {
        const { x: cellX, y: cellY, width: cellWidth, height: cellHeight } = getCellCoordinates(i);
        
        // Create cell content group (for export)
        const cellContentGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        cellContentGroup.setAttribute('data-cell-index', i);
        cellContentGroup.setAttribute('class', 'cell-content');
        
        // Create cell UI group (hidden during export)
        const cellUIGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        cellUIGroup.setAttribute('data-cell-index', i);
        cellUIGroup.setAttribute('class', 'cell-ui');
        cellUIGroup.style.cursor = 'pointer';
        
        // Render cell content (images go to content layer, buttons and cell visuals go to UI layer)
        renderSVGCell(cellContentGroup, cellUIGroup, i, cellX, cellY, cellWidth, cellHeight, gridSpacing.cellPadding);
        
        // Add click handler for cell interaction to UI layer
        cellUIGroup.addEventListener('click', () => handleCellAdd(i));
        
        // Add groups to respective layers
        contentLayer.appendChild(cellContentGroup);
        uiLayer.appendChild(cellUIGroup);
    }
    
    // Add layers to SVG
    svg.appendChild(contentLayer);
    svg.appendChild(uiLayer);
    
    elements.sheet.appendChild(svg);
}

function updateSheetGrid() {
    const { rows, cols } = layoutState.grid;
    
    // Create or update SVG sheet preview
    renderSVGSheet();
}

function setupGridMatrix() {
    const matrix = elements.gridMatrix;
    matrix.innerHTML = '';
    
    // Track touch state for drag highlighting
    let isDragging = false;
    
    // Create 5x5 grid of selectable cells
    for (let row = 1; row <= CONFIG.maxGridSize; row++) {
        for (let col = 1; col <= CONFIG.maxGridSize; col++) {
            const cell = document.createElement('div');
            cell.className = 'grid-cell';
            cell.dataset.row = row;
            cell.dataset.col = col;
            
            // Mouse event handlers for desktop
            cell.addEventListener('mouseenter', () => highlightGridArea(col, row));
            cell.addEventListener('click', () => selectGrid(col, row));
            
            // Touch event handlers for mobile
            cell.addEventListener('touchstart', (e) => {
                e.preventDefault(); // Prevent scrolling and other default behaviors
                isDragging = true;
                highlightGridArea(col, row);
            });
            
            cell.addEventListener('touchmove', (e) => {
                e.preventDefault();
                if (isDragging) {
                    // Find which cell is under the touch point
                    const touch = e.touches[0];
                    const elementUnderTouch = document.elementFromPoint(touch.clientX, touch.clientY);
                    
                    if (elementUnderTouch && elementUnderTouch.classList.contains('grid-cell')) {
                        const touchCol = parseInt(elementUnderTouch.dataset.col);
                        const touchRow = parseInt(elementUnderTouch.dataset.row);
                        highlightGridArea(touchCol, touchRow);
                    }
                }
            });
            
            cell.addEventListener('touchend', (e) => {
                e.preventDefault();
                if (isDragging) {
                    isDragging = false;
                    // Select the grid that was highlighted when touch ended
                    const touch = e.changedTouches[0];
                    const elementUnderTouch = document.elementFromPoint(touch.clientX, touch.clientY);
                    
                    if (elementUnderTouch && elementUnderTouch.classList.contains('grid-cell')) {
                        const touchCol = parseInt(elementUnderTouch.dataset.col);
                        const touchRow = parseInt(elementUnderTouch.dataset.row);
                        selectGrid(touchCol, touchRow);
                    }
                }
            });
            
            matrix.appendChild(cell);
        }
    }
    
    // Add global touch cancel handler for the grid matrix
    matrix.addEventListener('touchcancel', () => {
        isDragging = false;
    });
}

function highlightGridArea(cols, rows) {
    const cells = elements.gridMatrix.children;
    
    for (let i = 0; i < cells.length; i++) {
        const cell = cells[i];
        const cellCol = parseInt(cell.dataset.col);
        const cellRow = parseInt(cell.dataset.row);
        
        if (cellCol <= cols && cellRow <= rows) {
            cell.classList.add('highlighted');
        } else {
            cell.classList.remove('highlighted');
        }
    }
    
    // Update display
    elements.gridDisplay.textContent = `${cols} × ${rows}`;
}

function selectGrid(cols, rows) {
    const currentTotalCells = layoutState.grid.rows * layoutState.grid.cols;
    const newTotalCells = rows * cols;
    
    // Check if we're reducing the grid size and if there's data that would be lost
    if (newTotalCells < currentTotalCells) {
        const cellsToRemove = layoutState.cells.slice(newTotalCells);
        const hasDataInRemovedCells = cellsToRemove.some(cell => cell !== null && cell !== undefined);
        
        if (hasDataInRemovedCells) {
            const lostContentCount = cellsToRemove.filter(cell => cell !== null && cell !== undefined).length;
            const confirmMessage = 
                `Warning: Changing to a ${cols} × ${rows} grid will remove ${currentTotalCells - newTotalCells} cells.\n\n` +
                `This will permanently delete ${lostContentCount} piece(s) of content from your layout.\n\n` +
                `Are you sure you want to continue?`;
            
            const userConfirmed = confirm(confirmMessage);
            if (!userConfirmed) {
                return; // Don't proceed with grid change
            }
        }
    }
    
    // Proceed with grid change
    layoutState.grid.cols = cols;
    layoutState.grid.rows = rows;
    
    // Clear cells that are outside new grid (now with user consent)
    const totalCells = rows * cols;
    if (layoutState.cells.length > totalCells) {
        layoutState.cells = layoutState.cells.slice(0, totalCells);
    }
    
    updateSheetGrid();
    hideGridPicker();
}

function showGridPicker() {
    overlayManager.show(elements.gridOverlay, () => {
        // Highlight current grid
        highlightGridArea(layoutState.grid.cols, layoutState.grid.rows);
    });
}

function hideGridPicker() {
    overlayManager.hide(elements.gridOverlay);
}

function setupSizeOptions() {
    const sizeOptions = document.querySelectorAll('.size-option');
    
    sizeOptions.forEach(option => {
        option.addEventListener('click', () => {
            const size = option.dataset.size;
            const orientation = option.dataset.orientation;
            
            // Update state
            layoutState.sheet.paperSize = size;
            layoutState.sheet.orientation = orientation;
            
            // Update UI
            updateSheetSize();
            hideSizePicker();
        });
    });
}

function showSizePicker() {
    overlayManager.show(elements.sizeOverlay, () => {
        // Highlight current selection
        highlightCurrentSize();
    });
}

function hideSizePicker() {
    overlayManager.hide(elements.sizeOverlay);
}

function showExportOverlay() {
    overlayManager.show(elements.exportOverlay);
}

function hideExportOverlay() {
    overlayManager.hide(elements.exportOverlay);
}

function highlightCurrentSize() {
    const sizeOptions = document.querySelectorAll('.size-option');
    const currentSize = layoutState.sheet.paperSize;
    const currentOrientation = layoutState.sheet.orientation;
    
    sizeOptions.forEach(option => {
        const size = option.dataset.size;
        const orientation = option.dataset.orientation;
        
        if (size === currentSize && orientation === currentOrientation) {
            option.classList.add('selected');
        } else {
            option.classList.remove('selected');
        }
    });
}

function showFileTypeSelector() {
    overlayManager.show(elements.fileTypeSelector);
}

function hideFileTypeSelector() {
    overlayManager.hide(elements.fileTypeSelector);
}

function cancelFileTypeSelector() {
    overlayManager.hide(elements.fileTypeSelector, () => {
        currentTargetCell = null;
    });
}

async function showCameraOverlay() {
    overlayManager.show(elements.cameraOverlay);
    resetCameraCapture();

    try {
        await startCameraStream(cameraState.selectedDeviceId);
    } catch (error) {
        hideCameraOverlay();
        alert('Camera access is unavailable. Please use Image File instead.');
    }
}

function hideCameraOverlay() {
    stopCameraStream();
    resetCameraDeviceOptions();
    resetCameraCapture();
    overlayManager.hide(elements.cameraOverlay);
}

function cancelCameraOverlay() {
    hideCameraOverlay();
    currentTargetCell = null;
}

async function startCameraStream(deviceId = '') {
    if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Camera API not available');
    }

    stopCameraStream();

    const videoConstraints = deviceId ? { deviceId: { exact: deviceId } } : true;
    const stream = await navigator.mediaDevices.getUserMedia({ video: videoConstraints, audio: false });
    cameraState.stream = stream;

    const activeTrack = stream.getVideoTracks()[0];
    const activeSettings = activeTrack?.getSettings?.();
    cameraState.selectedDeviceId = activeSettings?.deviceId || deviceId || cameraState.selectedDeviceId;

    elements.cameraVideo.srcObject = stream;
    await elements.cameraVideo.play();
    await refreshCameraDevices();
}

function stopCameraStream() {
    if (cameraState.stream) {
        cameraState.stream.getTracks().forEach(track => track.stop());
        cameraState.stream = null;
    }

    if (elements.cameraVideo) {
        elements.cameraVideo.pause();
        elements.cameraVideo.srcObject = null;
    }
}

async function refreshCameraDevices() {
    if (!navigator.mediaDevices?.enumerateDevices) {
        resetCameraDeviceOptions();
        return;
    }

    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter(device => device.kind === 'videoinput');
    cameraState.devices = videoDevices;

    if (!videoDevices.length) {
        resetCameraDeviceOptions();
        return;
    }

    const currentDeviceId = cameraState.selectedDeviceId || videoDevices[0].deviceId;
    const deviceOptions = videoDevices.map((device, index) => {
        const option = document.createElement('option');
        option.value = device.deviceId;
        option.textContent = device.label || `Camera ${index + 1}`;
        return option;
    });

    elements.cameraDeviceSelect.innerHTML = '';
    deviceOptions.forEach(option => elements.cameraDeviceSelect.appendChild(option));
    elements.cameraDeviceSelect.value = videoDevices.some(device => device.deviceId === currentDeviceId)
        ? currentDeviceId
        : videoDevices[0].deviceId;
    cameraState.selectedDeviceId = elements.cameraDeviceSelect.value;

    if (videoDevices.length > 1) {
        elements.cameraDeviceField.classList.remove('hidden');
    } else {
        elements.cameraDeviceField.classList.add('hidden');
    }
}

function resetCameraDeviceOptions() {
    cameraState.devices = [];
    elements.cameraDeviceSelect.innerHTML = '';
    elements.cameraDeviceField.classList.add('hidden');
}

async function handleCameraDeviceChange() {
    const nextDeviceId = elements.cameraDeviceSelect.value;
    if (!nextDeviceId || nextDeviceId === cameraState.selectedDeviceId) {
        return;
    }

    cameraState.selectedDeviceId = nextDeviceId;
    resetCameraCapture();

    try {
        await startCameraStream(nextDeviceId);
    } catch (error) {
        alert('Failed to switch camera. Please try another device.');
    }
}

function captureCameraFrame() {
    const video = elements.cameraVideo;
    if (!video.videoWidth || !video.videoHeight) {
        alert('Camera preview is not ready yet. Please try again.');
        return;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    if (!ctx) {
        alert('Failed to capture photo. Please try again.');
        return;
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    cameraState.capturedDataUrl = canvas.toDataURL('image/png');

    elements.cameraCapturedImage.src = cameraState.capturedDataUrl;
    elements.cameraCapturedImage.classList.remove('hidden');
    elements.cameraVideo.classList.add('hidden');
    elements.cameraCaptureBtn.classList.add('hidden');
    elements.cameraUseBtn.classList.remove('hidden');
    elements.cameraRetakeBtn.classList.remove('hidden');
}

function resetCameraCapture() {
    cameraState.capturedDataUrl = null;
    elements.cameraCapturedImage.src = '';
    elements.cameraCapturedImage.classList.add('hidden');
    elements.cameraVideo.classList.remove('hidden');
    elements.cameraCaptureBtn.classList.remove('hidden');
    elements.cameraUseBtn.classList.add('hidden');
    elements.cameraRetakeBtn.classList.add('hidden');
}

async function useCapturedPhoto() {
    const dataUrl = cameraState.capturedDataUrl;
    const targetCell = currentTargetCell;

    if (!dataUrl || targetCell === null) {
        return;
    }

    hideCameraOverlay();
    showLoading('Processing photo...');

    try {
        const persistentImg = await createPersistentImageFromDataUrl(dataUrl);
        addToSpecificCell(persistentImg, 'Camera photo', targetCell);
    } catch (error) {
        alert('Failed to use captured photo. Please try again.');
    } finally {
        hideLoading();
        if (currentTargetCell === targetCell) {
            currentTargetCell = null;
        }
    }
}

function showPageSelector() {
    overlayManager.show(elements.pageSelector);
}

function hidePageSelector() {
    cancelPDFPageSelectorGeneration();
    overlayManager.hide(elements.pageSelector);
}

function showLoading(message = 'Loading...') {
    if (!elements.loading) return; // Safety check for early calls
    overlayManager.show(elements.loading, () => {
        const loadingText = elements.loading.querySelector('p');
        if (loadingText) loadingText.textContent = message;
    });
}

function hideLoading() {
    if (!elements.loading) return; // Safety check for early calls
    overlayManager.hide(elements.loading);
}

function showStatusToast(message, duration = 2000) {
    if (statusToastTimeoutId) {
        clearTimeout(statusToastTimeoutId);
        statusToastTimeoutId = null;
    }

    if (activeStatusToast) {
        activeStatusToast.remove();
    }

    const toast = document.createElement('div');
    toast.className = 'status-toast';
    toast.innerHTML = `<div class="status-toast-content">${message}</div>`;
    document.body.appendChild(toast);
    activeStatusToast = toast;

    statusToastTimeoutId = setTimeout(() => {
        if (activeStatusToast === toast) {
            toast.remove();
            activeStatusToast = null;
        }
        statusToastTimeoutId = null;
    }, duration);
}

function showBitonalPopover(cellIndex, anchorRect) {
    const cellData = layoutState.cells[cellIndex];
    if (!cellData?.image) return;

    cellData.filterSettings = cellData.filterSettings || { bitonalThreshold: DEFAULT_BITONAL_THRESHOLD };
    bitonalPopoverState.cellIndex = cellIndex;
    bitonalPopoverState.anchorRect = anchorRect;

    elements.bitonalThresholdSlider.value = String(getBitonalThreshold(cellData));
    positionBitonalPopover(anchorRect);
    elements.bitonalPopover.classList.remove('hidden');
}

function positionBitonalPopover(anchorRect = bitonalPopoverState.anchorRect) {
    if (!anchorRect || !elements.bitonalPopover) return;

    const popover = elements.bitonalPopover;
    const popoverWidth = Math.min(window.innerWidth * 0.42, 220);
    const left = Math.min(
        Math.max(12, anchorRect.left + (anchorRect.width / 2) - (popoverWidth / 2)),
        window.innerWidth - popoverWidth - 12
    );
    const top = Math.max(12, anchorRect.bottom + 10);

    popover.style.left = `${left}px`;
    popover.style.top = `${top}px`;
}

function hideBitonalPopover() {
    clearBitonalLongPress();
    if (bitonalPopoverState.frameRequestId) {
        cancelAnimationFrame(bitonalPopoverState.frameRequestId);
        bitonalPopoverState.frameRequestId = null;
    }
    bitonalPopoverState.cellIndex = null;
    bitonalPopoverState.anchorRect = null;
    bitonalPopoverState.suppressNextClick = false;
    bitonalPopoverState.applying = false;
    bitonalPopoverState.pendingThreshold = null;
    if (elements.bitonalPopover) {
        elements.bitonalPopover.classList.add('hidden');
    }
}

function clearBitonalLongPress() {
    if (bitonalPopoverState.longPressTimer) {
        clearTimeout(bitonalPopoverState.longPressTimer);
        bitonalPopoverState.longPressTimer = null;
    }
}

function handleGlobalPointerDown(event) {
    if (elements.bitonalPopover?.classList.contains('hidden')) {
        return;
    }

    if (elements.bitonalPopover.contains(event.target)) {
        return;
    }

    hideBitonalPopover();
}

function handleBitonalThresholdInput() {
    const cellIndex = bitonalPopoverState.cellIndex;
    const cellData = cellIndex !== null ? layoutState.cells[cellIndex] : null;
    if (!cellData?.image) return;

    cellData.filterSettings = cellData.filterSettings || { bitonalThreshold: DEFAULT_BITONAL_THRESHOLD };
    bitonalPopoverState.pendingThreshold = Number(elements.bitonalThresholdSlider.value);

    if (bitonalPopoverState.frameRequestId) {
        return;
    }

    bitonalPopoverState.frameRequestId = requestAnimationFrame(() => {
        bitonalPopoverState.frameRequestId = null;
        applyBitonalThresholdPreview();
    });
}

async function applyBitonalThresholdPreview() {
    const cellIndex = bitonalPopoverState.cellIndex;
    const cellData = cellIndex !== null ? layoutState.cells[cellIndex] : null;
    if (!cellData?.image || cellData.filter !== 'bitonal') return;

    if (bitonalPopoverState.applying) {
        return;
    }

    const nextThreshold = bitonalPopoverState.pendingThreshold;
    if (nextThreshold === null) {
        return;
    }

    bitonalPopoverState.pendingThreshold = null;
    cellData.filterSettings = cellData.filterSettings || { bitonalThreshold: DEFAULT_BITONAL_THRESHOLD };
    cellData.filterSettings.bitonalThreshold = nextThreshold;
    bitonalPopoverState.applying = true;

    try {
        await applyCellFilter(cellIndex, 'bitonal');
    } catch (error) {
        console.error('Failed to update 1-bit threshold:', error);
    } finally {
        bitonalPopoverState.applying = false;

        if (bitonalPopoverState.pendingThreshold !== null && bitonalPopoverState.cellIndex === cellIndex) {
            applyBitonalThresholdPreview();
        }
    }
}

function bindBitonalPopoverTriggers(filterBtn, cellIndex) {
    filterBtn.addEventListener('contextmenu', (event) => {
        event.preventDefault();
        event.stopPropagation();
        openBitonalPopoverForCell(cellIndex, filterBtn.getBoundingClientRect());
    });

    filterBtn.addEventListener('pointerdown', (event) => {
        if (event.pointerType !== 'touch') return;
        clearBitonalLongPress();
        bitonalPopoverState.longPressTimer = setTimeout(() => {
            bitonalPopoverState.suppressNextClick = true;
            openBitonalPopoverForCell(cellIndex, filterBtn.getBoundingClientRect());
        }, 450);
    });

    ['pointerup', 'pointercancel', 'pointerleave'].forEach(eventName => {
        filterBtn.addEventListener(eventName, clearBitonalLongPress);
    });
}

async function openBitonalPopoverForCell(cellIndex, anchorRect) {
    const cellData = layoutState.cells[cellIndex];
    if (!cellData?.image) return;

    if (cellData.filter !== 'bitonal') {
        try {
            await applyCellFilter(cellIndex, 'bitonal');
        } catch (error) {
            console.error('Failed to open 1-bit threshold control:', error);
            return;
        }
    }

    showBitonalPopover(cellIndex, anchorRect);
}

// Export functionality
async function handleQualityExport(quality) {
    hideExportOverlay();
    showLoading(`Exporting in ${EXPORT_QUALITY[quality].label} quality...`);
    
    try {
        const pdf = await assemblePDF(quality);
        downloadPDF(pdf, quality);
        hideLoading();
        showStatusToast('Export complete!');
    } catch (error) {
        hideLoading();
        console.error('Export failed:', error);
        alert('Export failed. Please try again.');
    }
}

async function assemblePDF(quality) {
    const { width, height, orientation } = layoutState.sheet;
    const { scale, jpegQuality } = EXPORT_QUALITY[quality];
    const pdf = new jsPDF({ 
        orientation: orientation === 'landscape' ? 'l' : 'p', 
        unit: 'mm', 
        format: [width, height] 
    });
    
    showLoading('Rasterizing sheet...');
    const renderedSheet = await renderSheetToFullCanvas(scale);
    
    // Process each cell that has content
    for (let i = 0; i < layoutState.cells.length; i++) {
        if (layoutState.cells[i]) {
            const imageBounds = getActualImageBounds(i);
            if (!imageBounds) {
                continue;
            }

            const cellImageData = extractCellImageFromRenderedSheet(renderedSheet, imageBounds, scale, jpegQuality);
            if (!cellImageData) {
                continue;
            }
            
            pdf.addImage(
                cellImageData, 
                'JPEG', 
                imageBounds.x, 
                imageBounds.y, 
                imageBounds.width, 
                imageBounds.height
            );
        }
    }
    
    showLoading('Assembling PDF...');
    return pdf;
}

async function renderSheetToFullCanvas(scale) {
    // Get the main SVG element
    const svg = elements.sheet.querySelector('svg');
    if (!svg) {
        throw new Error('SVG sheet not found');
    }
    
    // Hide UI layer temporarily
    const uiLayer = svg.querySelector('#ui-layer');
    const originalVisibility = uiLayer ? uiLayer.style.display : '';
    if (uiLayer) {
        uiLayer.style.display = 'none';
    }
    
    try {
        return await renderSVGToFullCanvas(svg, scale);
    } finally {
        // Restore UI layer visibility
        if (uiLayer) {
            uiLayer.style.display = originalVisibility;
        }
    }
}

async function renderSVGToFullCanvas(svg, scale) {
    const img = await loadImageFromSrc(serializeSVGToDataUrl(svg));
    const fullCanvas = document.createElement('canvas');
    const fullWidth = Math.round(layoutState.sheet.width * scale);
    const fullHeight = Math.round(layoutState.sheet.height * scale);
    const fullCtx = fullCanvas.getContext('2d');

    if (!fullCtx || !fullWidth || !fullHeight) {
        throw new Error('Failed to prepare full-sheet canvas');
    }

    fullCanvas.width = fullWidth;
    fullCanvas.height = fullHeight;
    fullCtx.drawImage(img, 0, 0, fullWidth, fullHeight);

    return fullCanvas;
}

function extractCellImageFromRenderedSheet(fullCanvas, cellCoords, scale, jpegQuality) {
    const targetWidth = Math.round(cellCoords.width * scale);
    const targetHeight = Math.round(cellCoords.height * scale);

    if (!targetWidth || !targetHeight) {
        return null;
    }

    const cellCanvas = document.createElement('canvas');
    cellCanvas.width = targetWidth;
    cellCanvas.height = targetHeight;

    const cellCtx = cellCanvas.getContext('2d');
    if (!cellCtx) {
        throw new Error('Failed to prepare cell canvas');
    }

    const sourceX = Math.round(cellCoords.x * scale);
    const sourceY = Math.round(cellCoords.y * scale);
    cellCtx.drawImage(
        fullCanvas,
        sourceX, sourceY, targetWidth, targetHeight,
        0, 0, targetWidth, targetHeight
    );

    return cellCanvas.toDataURL('image/jpeg', jpegQuality);
}

function serializeSVGToDataUrl(svg) {
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svg);
    const cleanSvgString = svgString.includes('<?xml')
        ? svgString
        : `<?xml version="1.0" encoding="UTF-8"?>${svgString}`;

    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(cleanSvgString)}`;
}

function getGridMetrics() {
    const { cols, rows } = layoutState.grid;
    const { width, height } = layoutState.sheet;
    const gridSpacing = CONFIG.gridSpacing;
    const availableWidth = width - gridSpacing.sheetPadding.left - gridSpacing.sheetPadding.right;
    const availableHeight = height - gridSpacing.sheetPadding.top - gridSpacing.sheetPadding.bottom;
    const totalGapWidth = gridSpacing.columnGap * (cols - 1);
    const totalGapHeight = gridSpacing.rowGap * (rows - 1);

    return {
        width,
        height,
        cols,
        rows,
        totalCells: rows * cols,
        gridSpacing,
        cellWidth: (availableWidth - totalGapWidth) / cols,
        cellHeight: (availableHeight - totalGapHeight) / rows
    };
}

function getCellCoordinates(cellIndex) {
    const { cols, gridSpacing, cellWidth, cellHeight } = getGridMetrics();
    const col = cellIndex % cols;
    const row = Math.floor(cellIndex / cols);

    return {
        x: gridSpacing.sheetPadding.left + col * (cellWidth + gridSpacing.columnGap),
        y: gridSpacing.sheetPadding.top + row * (cellHeight + gridSpacing.rowGap),
        width: cellWidth,
        height: cellHeight
    };
}

function getCellContentCoordinates(cellIndex) {
    const cellCoords = getCellCoordinates(cellIndex);
    const { cellPadding } = CONFIG.gridSpacing;

    return {
        x: cellCoords.x + cellPadding,
        y: cellCoords.y + cellPadding,
        width: cellCoords.width - (cellPadding * 2),
        height: cellCoords.height - (cellPadding * 2)
    };
}

function getActualImageBounds(cellIndex) {
    const cellData = layoutState.cells[cellIndex];
    if (!cellData?.image) return null;
    
    const contentCoords = getCellContentCoordinates(cellIndex);
    const { image, fillMode, transform } = cellData;
    
    const imgX = contentCoords.x;
    const imgY = contentCoords.y;
    const imgWidth = contentCoords.width;
    const imgHeight = contentCoords.height;
    
    switch (fillMode) {
        case 'fill':
            // Fill mode stretches to entire cell content area
            return {
                x: imgX,
                y: imgY,
                width: imgWidth,
                height: imgHeight
            };
            
        case 'cover':
            // Cover mode: calculate actual visible image bounds considering user transforms
            const imageAspectCover = image.width / image.height;
            const cellAspectCover = imgWidth / imgHeight;
            
            // Calculate base size (scale to fill cell)
            let baseWidth, baseHeight;
            if (imageAspectCover > cellAspectCover) {
                // Image is wider than cell - scale to fill height
                baseHeight = imgHeight;
                baseWidth = baseHeight * imageAspectCover;
            } else {
                // Image is taller than cell - scale to fill width
                baseWidth = imgWidth;
                baseHeight = baseWidth / imageAspectCover;
            }
            
            // Apply user transforms
            const transformCover = transform || { scale: 1, translateX: 0, translateY: 0 };
            const finalWidth = baseWidth * transformCover.scale;
            const finalHeight = baseHeight * transformCover.scale;
            
            // Calculate image position with transforms
            const centerX = imgX + imgWidth / 2;
            const centerY = imgY + imgHeight / 2;
            const finalX = centerX - finalWidth / 2 + transformCover.translateX;
            const finalY = centerY - finalHeight / 2 + transformCover.translateY;
            
            // Find intersection between transformed image and cell area
            const visibleLeft = Math.max(finalX, imgX);
            const visibleTop = Math.max(finalY, imgY);
            const visibleRight = Math.min(finalX + finalWidth, imgX + imgWidth);
            const visibleBottom = Math.min(finalY + finalHeight, imgY + imgHeight);
            
            // If no intersection, return null (shouldn't happen in practice)
            if (visibleLeft >= visibleRight || visibleTop >= visibleBottom) {
                return null;
            }
            
            return {
                x: visibleLeft,
                y: visibleTop,
                width: visibleRight - visibleLeft,
                height: visibleBottom - visibleTop
            };
            
        case 'contain':
        default:
            // Contain mode: scale to fit within cell while maintaining aspect ratio
            const imageAspect = image.width / image.height;
            const cellAspect = imgWidth / imgHeight;
            
            let actualWidth, actualHeight;
            if (imageAspect > cellAspect) {
                // Image is wider - fit to width
                actualWidth = imgWidth;
                actualHeight = actualWidth / imageAspect;
            } else {
                // Image is taller - fit to height
                actualHeight = imgHeight;
                actualWidth = actualHeight * imageAspect;
            }
            
            // Center the image in the cell
            const actualX = imgX + (imgWidth - actualWidth) / 2;
            const actualY = imgY + (imgHeight - actualHeight) / 2;
            
            return {
                x: actualX,
                y: actualY,
                width: actualWidth,
                height: actualHeight
            };
    }
}

function downloadPDF(pdf, quality) {
    const filename = `PDFomator ${quality}.pdf`;
    
    showLoading('Preparing download...');
    pdf.save(filename);
}
