// PDFomator - Main Application Logic
// ES Module with vanilla JavaScript for PDF page layout

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
    pdfWorkerUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.0.379/build/pdf.worker.mjs'
};

// Overlay management utilities
const overlayManager = {
    show(element, onShow = null) {
        if (!element) return; // Safety check
        element.classList.remove('hidden');
        if (onShow) onShow();
    },
    
    hide(element, onHide = null) {
        if (!element) return; // Safety check
        element.classList.add('hidden');
        if (onHide) onHide();
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
    
    // Initialize the sheet size and grid
    updateSheetSize();
    updateSheetGrid();
    
    // Setup event listeners
    setupEventListeners();
}

function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js')
            .then(registration => {
                console.log('[App] Service Worker registered successfully:', registration.scope);
                
                // Get and display version from service worker
                getServiceWorkerVersion();
                
                // Check for updates
                registration.addEventListener('updatefound', () => {
                    console.log('[App] Service Worker update found');
                    
                    const newWorker = registration.installing;
                    if (newWorker) {
                        newWorker.addEventListener('statechange', () => {
                            console.log('[App] New Service Worker state:', newWorker.state);
                            
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                // New version is available
                                console.log('[App] New version available, will auto-update');
                                showUpdateNotification();
                            }
                        });
                    }
                });
                
                // Automatically check for updates periodically
                setInterval(() => {
                    console.log('[App] Checking for updates...');
                    registration.update();
                }, 60000); // Check every minute
                
            })
            .catch(error => {
                console.error('[App] Service Worker registration failed:', error);
            });
            
        // Listen for service worker controller changes
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            console.log('[App] Service Worker controller changed - reloading app');
            // Automatically reload when new service worker takes control
            window.location.reload();
        });
    } else {
        console.log('[App] Service Worker not supported');
    }
}

function showUpdateNotification() {
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
        if (navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
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

async function getServiceWorkerVersion() {
    console.log('[App] Attempting to get version from service worker');
    
    if (!('serviceWorker' in navigator)) {
        console.log('[App] Service Worker not supported');
        return;
    }
    
    // Try to get version from active service worker
    const serviceWorker = navigator.serviceWorker.controller || navigator.serviceWorker.active;
    
    if (!serviceWorker) {
        console.log('[App] No active service worker found, retrying in 500ms...');
        // Retry after a short delay
        setTimeout(() => getServiceWorkerVersion(), 500);
        return;
    }
    
    try {
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
        console.log('[App] Received version from service worker:', version);
        updateVersionDisplay(version);
    } catch (error) {
        console.warn('[App] Failed to get version from service worker:', error);
        // Fallback: show a default version or retry
        setTimeout(() => getServiceWorkerVersion(), 1000);
    }
}

function updateVersionDisplay(cacheVersion) {
    const versionElement = document.getElementById('version');
    if (versionElement && cacheVersion) {
        // Extract version from cache name (e.g., 'pdfomator-v1.0.2' -> 'v1.0.2')
        const version = cacheVersion.split('-').pop();
        versionElement.textContent = version;
        console.log('[App] Version displayed:', version);
    } else {
        console.log('[App] Version element not found or no cache version provided');
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
        gridOverlay: document.getElementById('gridOverlay'),
        gridMatrix: document.getElementById('gridMatrix'),
        gridDisplay: document.getElementById('gridDisplay'),
        cancelGrid: document.getElementById('cancelGrid'),
        sizeOverlay: document.getElementById('sizeOverlay'),
        cancelSize: document.getElementById('cancelSize'),
        fileTypeSelector: document.getElementById('fileTypeSelector'),
        selectPdfBtn: document.getElementById('selectPdfBtn'),
        selectImageBtn: document.getElementById('selectImageBtn'),
        cancelFileType: document.getElementById('cancelFileType'),
        pageSelector: document.getElementById('pageSelector'),
        pageGrid: document.getElementById('pageGrid'),
        cancelPageSelection: document.getElementById('cancelPageSelection'),
        loading: document.getElementById('loading')
    };
}

function showError(message) {
    alert(`PDFomator Error: ${message}`);
}

async function setupPDFWorker() {
    try {
        // Wait for PDF.js to be loaded with more sophisticated checking
        let attempts = 0;
        const maxAttempts = 100; // 10 seconds max wait
        
        while (attempts < maxAttempts) {
            // Check if pdfjsLib is available and has the required methods
            // Also check for window.pdfjsLib as it might be attached to window with ES modules
            const lib = window.pdfjsLib || pdfjsLib;
            if (typeof lib !== 'undefined' && lib.getDocument && lib.GlobalWorkerOptions) {
                // Assign to global for consistency
                window.pdfjsLib = lib;
                break;
            }
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        const lib = window.pdfjsLib || pdfjsLib;
        if (typeof lib === 'undefined' || !lib.getDocument) {
            throw new Error('PDF.js failed to load completely. Please check your internet connection and refresh the page.');
        }
        
        // Configure PDF.js worker
        lib.GlobalWorkerOptions.workerSrc = CONFIG.pdfWorkerUrl;
        
    } catch (error) {
        // Show user-friendly error
        showError('PDF processing library failed to load. Please check your internet connection and refresh the page.');
    }
}

function setupEventListeners() {
    // FAB button handlers
    elements.sizeBtn.addEventListener('click', handleSizePicker);
    elements.gridBtn.addEventListener('click', handleGridPicker);
    elements.exportBtn.addEventListener('click', handleExport);
    
    // File input handlers
    elements.pdfInput.addEventListener('change', handlePDFSelection);
    elements.imageInput.addEventListener('change', handleImageSelection);
    
    // File type selector handlers
    elements.selectPdfBtn.addEventListener('click', () => {
        hideFileTypeSelector();
        elements.pdfInput.click();
    });
    elements.selectImageBtn.addEventListener('click', () => {
        hideFileTypeSelector();
        elements.imageInput.click();
    });
    elements.cancelFileType.addEventListener('click', cancelFileTypeSelector);
    
    // Cancel button handlers
    elements.cancelGrid.addEventListener('click', hideGridPicker);
    elements.cancelSize.addEventListener('click', hideSizePicker);
    
    // Page selector handlers
    elements.cancelPageSelection.addEventListener('click', hidePageSelector);
    
    // Setup overlay background click handlers
    overlayManager.setupClickOutside(elements.gridOverlay, hideGridPicker);
    overlayManager.setupClickOutside(elements.sizeOverlay, hideSizePicker);
    overlayManager.setupClickOutside(elements.fileTypeSelector, cancelFileTypeSelector);
    overlayManager.setupClickOutside(elements.pageSelector, hidePageSelector);
    
    // Setup grid matrix
    setupGridMatrix();
    
    // Setup size options
    setupSizeOptions();
    
    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboard);
}

function handleKeyboard(e) {
    // ESC to close overlays
    if (e.key === 'Escape') {
        hideGridPicker();
        hideSizePicker();
        cancelFileTypeSelector();
        hidePageSelector();
        hideLoading();
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
    
    showLoading('Preparing export...');
    
    try {
        // TODO: Implement new export functionality
        alert('Export functionality will be implemented soon!');
    } catch (error) {
        alert('Export failed. Please try again.');
    } finally {
        hideLoading();
    }
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
    const files = Array.from(e.target.files);
    const targetCell = currentTargetCell; // Store target cell to prevent race conditions
    
    if (files.length === 0 || targetCell === null) return;
    
    const file = files[0]; // Single file selection
    showLoading('Processing image...');
    
    try {
        await processImageFileForCell(file, targetCell);
    } catch (error) {
        alert('Failed to process image. Please try again.');
    } finally {
        hideLoading();
        elements.imageInput.value = '';
        // Only clear currentTargetCell if it still matches our stored value
        if (currentTargetCell === targetCell) {
            currentTargetCell = null;
        }
    }
}

async function processPDFFileForCell(file, cellIndex) {
    const lib = window.pdfjsLib || pdfjsLib;
    if (typeof lib === 'undefined' || !lib.getDocument) {
        throw new Error('PDF.js library not loaded. Please refresh the page and try again.');
    }
    
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await lib.getDocument(arrayBuffer).promise;
    
    if (pdf.numPages === 1) {
        // Single page - process directly
        const page = await pdf.getPage(1);
        const bitmap = await renderPDFPage(page, 2, 'bitmap');
        addToSpecificCell(bitmap, `${file.name} p1`, cellIndex);
    } else {
        // Multiple pages - show page selector
        await showPDFPageSelector(pdf, file.name, cellIndex);
    }
}

async function processImageFileForCell(file, cellIndex) {
    return new Promise((resolve, reject) => {
        // Use createImageBitmap for direct file-to-canvas rendering
        createImageBitmap(file)
            .then(bitmap => {
                try {
                    // Create canvas and draw bitmap directly
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    
                    canvas.width = bitmap.width;
                    canvas.height = bitmap.height;
                    
                    // Draw the bitmap onto the canvas
                    ctx.drawImage(bitmap, 0, 0);
                    
                    // Convert to data URL (JPEG with high quality for good compression)
                    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
                    
                    // Create a new image with the data URL
                    const persistentImg = new Image();
                    persistentImg.onload = () => {
                        // Add the image with persistent data URL after it loads
                        addToSpecificCell(persistentImg, file.name, cellIndex);
                        resolve();
                    };
                    persistentImg.onerror = () => {
                        reject(new Error('Failed to create persistent image'));
                    };
                    persistentImg.src = dataUrl;
                    
                    // Clean up the bitmap
                    bitmap.close();
                    
                } catch (error) {
                    bitmap.close(); // Clean up memory on error
                    reject(new Error('Failed to add image to cell'));
                }
            })
            .catch(error => {
                reject(new Error('Failed to load image file'));
            });
    });
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
        // Convert to JPEG bitmap
        const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
        const bitmap = new Image();
        bitmap.src = dataUrl;
        return bitmap;
    }
    
    return canvas;
}

async function showPDFPageSelector(pdf, fileName, cellIndex) {
    const pageGrid = elements.pageGrid;
    pageGrid.innerHTML = '';
    
    // Hide the initial loading overlay since we're showing the page selector
    hideLoading();
    
    // Show the page selector immediately
    showPageSelector();
    
    // Track thumbnail generation for cancellation
    let thumbnailGenerationCanceled = false;
    
    // Function to cancel thumbnail generation
    const cancelThumbnailGeneration = () => {
        thumbnailGenerationCanceled = true;
    };
    
    // Start the thumbnail generation process
    generateThumbnailsSequentially(pdf, fileName, cellIndex, pageGrid, cancelThumbnailGeneration, () => thumbnailGenerationCanceled);
}

async function generateThumbnailsSequentially(pdf, fileName, cellIndex, pageGrid, cancelFunction, isCanceledCheck) {
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        // Check if generation was canceled before processing each page
        if (isCanceledCheck()) {
            return; // Exit the loop immediately
        }
        
        try {
            const page = await pdf.getPage(pageNum);
            const thumbnail = await renderPDFPage(page, 0.5, 'canvas'); // Smaller scale for thumbnails
            
            // Check again after async operations in case user selected during rendering
            if (isCanceledCheck()) {
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
                cancelFunction();
                
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
            if (isCanceledCheck()) {
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
    // Store image data in new format for SVG compatibility
    layoutState.cells[cellIndex] = { 
        image: {
            src: content.src,
            width: content.naturalWidth,
            height: content.naturalHeight
        },
        title,
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
        
        const scaleChange = e.deltaY < 0 ? 1.1 : 0.9;
        const currentScale = cellData.transform.scale;
        const newScale = Math.max(0.5, Math.min(3, currentScale * scaleChange));
        
        cellData.transform.scale = newScale;
        renderSVGSheet();
    }
    
    function updateTransform(deltaX, deltaY, scaleChange) {
        try {
            // Convert screen coordinates to SVG coordinates
            const svg = elements.sheet.querySelector('svg');
            if (!svg) return;
            
            const rect = svg.getBoundingClientRect();
            const svgDeltaX = (deltaX / rect.width) * layoutState.sheet.width;
            const svgDeltaY = (deltaY / rect.height) * layoutState.sheet.height;
            
            // For smooth scaling, use the start transform scale as base
            const newScale = Math.max(0.5, Math.min(3, startTransform.scale * scaleChange));
            const newTranslateX = startTransform.translateX + svgDeltaX;
            const newTranslateY = startTransform.translateY + svgDeltaY;
            
            cellData.transform = {
                scale: newScale,
                translateX: newTranslateX,
                translateY: newTranslateY
            };
            
            renderSVGSheet();
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
function renderSVGCell(cellGroup, cellIndex, cellX, cellY, cellWidth, cellHeight, cellPadding) {
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
        cellGroup.appendChild(defs);
        
        // Create image element with different handling for cover mode
        const imageEl = document.createElementNS('http://www.w3.org/2000/svg', 'image');
        imageEl.setAttribute('href', cellData.image.src);
        imageEl.setAttribute('clip-path', `url(#${clipId})`);
        imageEl.style.cursor = 'pointer';
        
        if (cellData.fillMode === 'cover') {
            // For cover mode, implement custom scaling and positioning with transforms
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
            const transform = cellData.transform || { scale: 1, translateX: 0, translateY: 0 };
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
        
        cellGroup.appendChild(imageEl);
        
        // Add fill mode cycling button (small circle with square icon in top-left)
        const fillModeBtn = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        fillModeBtn.style.cursor = 'pointer';
        
        const fillModeBtnCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        fillModeBtnCircle.setAttribute('cx', cellX + 8);
        fillModeBtnCircle.setAttribute('cy', cellY + 8);
        fillModeBtnCircle.setAttribute('r', '6');
        fillModeBtnCircle.setAttribute('fill', 'rgba(40, 167, 69, 0.9)');
        fillModeBtnCircle.setAttribute('stroke', 'white');
        fillModeBtnCircle.setAttribute('stroke-width', '1');
        
        // Simple white square outline icon
        const fillModeBtnIcon = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        fillModeBtnIcon.setAttribute('x', cellX + 6);
        fillModeBtnIcon.setAttribute('y', cellY + 6);
        fillModeBtnIcon.setAttribute('width', '4');
        fillModeBtnIcon.setAttribute('height', '4');
        fillModeBtnIcon.setAttribute('fill', 'none');
        fillModeBtnIcon.setAttribute('stroke', 'white');
        fillModeBtnIcon.setAttribute('stroke-width', '1');
        
        fillModeBtn.appendChild(fillModeBtnCircle);
        fillModeBtn.appendChild(fillModeBtnIcon);
        
        // Add click handler for fill mode cycling button
        fillModeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            cycleFillMode(cellIndex);
        });
        
        cellGroup.appendChild(fillModeBtn);
        
        // Add remove button (small circle with X)
        const removeBtn = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        removeBtn.style.cursor = 'pointer';
        
        const removeBtnCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        removeBtnCircle.setAttribute('cx', cellX + cellWidth - 8);
        removeBtnCircle.setAttribute('cy', cellY + 8);
        removeBtnCircle.setAttribute('r', '6');
        removeBtnCircle.setAttribute('fill', 'rgba(220, 53, 69, 0.9)');
        removeBtnCircle.setAttribute('stroke', 'white');
        removeBtnCircle.setAttribute('stroke-width', '1');
        
        const removeBtnText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        removeBtnText.setAttribute('x', cellX + cellWidth - 8);
        removeBtnText.setAttribute('y', cellY + 8);
        removeBtnText.setAttribute('text-anchor', 'middle');
        removeBtnText.setAttribute('dominant-baseline', 'central');
        removeBtnText.setAttribute('font-family', 'monospace');
        removeBtnText.setAttribute('font-size', '10');
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
        
        cellGroup.appendChild(removeBtn);
        
        // Add reset button for cover mode (small circle with reset icon)
        if (cellData.fillMode === 'cover') {
            const resetBtn = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            resetBtn.style.cursor = 'pointer';
            
            const resetBtnCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            resetBtnCircle.setAttribute('cx', cellX + cellWidth - 8);
            resetBtnCircle.setAttribute('cy', cellY + cellHeight - 8);
            resetBtnCircle.setAttribute('r', '6');
            resetBtnCircle.setAttribute('fill', 'rgba(13, 110, 253, 0.9)');
            resetBtnCircle.setAttribute('stroke', 'white');
            resetBtnCircle.setAttribute('stroke-width', '1');
            
            const resetBtnText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            resetBtnText.setAttribute('x', cellX + cellWidth - 8);
            resetBtnText.setAttribute('y', cellY + cellHeight - 8);
            resetBtnText.setAttribute('text-anchor', 'middle');
            resetBtnText.setAttribute('dominant-baseline', 'central');
            resetBtnText.setAttribute('font-family', 'monospace');
            resetBtnText.setAttribute('font-size', '8');
            resetBtnText.setAttribute('fill', 'white');
            resetBtnText.setAttribute('font-weight', 'bold');
            resetBtnText.textContent = '⟲';
            
            resetBtn.appendChild(resetBtnCircle);
            resetBtn.appendChild(resetBtnText);
            
            // Add click handler for reset button
            resetBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                // Reset transform to default values
                cellData.transform = { scale: 1, translateX: 0, translateY: 0 };
                renderSVGSheet();
            });
            
            cellGroup.appendChild(resetBtn);
        }
        
    } else {
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
        
        cellGroup.appendChild(addBtn);
    }
}

// SVG-based sheet rendering function
function renderSVGSheet() {
    const { width, height } = layoutState.sheet;
    const { rows, cols } = layoutState.grid;
    
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
    
    // Add sheet background
    const sheetBg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    sheetBg.setAttribute('x', '0');
    sheetBg.setAttribute('y', '0');
    sheetBg.setAttribute('width', width);
    sheetBg.setAttribute('height', height);
    sheetBg.setAttribute('fill', 'white');
    sheetBg.setAttribute('stroke', '#ddd');
    sheetBg.setAttribute('stroke-width', '0.5');
    svg.appendChild(sheetBg);
    
    // Calculate grid spacing in mm (simplified - no CSS dependencies)
    const gridSpacing = {
        sheetPadding: { top: 10, right: 10, bottom: 10, left: 10 },
        columnGap: 5,
        rowGap: 5,
        cellPadding: 2
    };
    
    // Calculate available space and cell dimensions
    const availableWidth = width - gridSpacing.sheetPadding.left - gridSpacing.sheetPadding.right;
    const availableHeight = height - gridSpacing.sheetPadding.top - gridSpacing.sheetPadding.bottom;
    const totalGapWidth = gridSpacing.columnGap * (cols - 1);
    const totalGapHeight = gridSpacing.rowGap * (rows - 1);
    const cellWidth = (availableWidth - totalGapWidth) / cols;
    const cellHeight = (availableHeight - totalGapHeight) / rows;
    
    // Render each cell
    const totalCells = rows * cols;
    for (let i = 0; i < totalCells; i++) {
        const row = Math.floor(i / cols);
        const col = i % cols;
        
        // Calculate cell position
        const cellX = gridSpacing.sheetPadding.left + col * (cellWidth + gridSpacing.columnGap);
        const cellY = gridSpacing.sheetPadding.top + row * (cellHeight + gridSpacing.rowGap);
        
        // Create cell group
        const cellGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        cellGroup.setAttribute('data-cell-index', i);
        cellGroup.style.cursor = 'pointer';
        
        // Cell background
        const cellRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        cellRect.setAttribute('x', cellX);
        cellRect.setAttribute('y', cellY);
        cellRect.setAttribute('width', cellWidth);
        cellRect.setAttribute('height', cellHeight);
        cellRect.setAttribute('fill', '#f8f9fa');
        cellRect.setAttribute('stroke', '#dee2e6');
        cellRect.setAttribute('stroke-width', '0.5');
        cellGroup.appendChild(cellRect);
        
        // Render cell content
        renderSVGCell(cellGroup, i, cellX, cellY, cellWidth, cellHeight, gridSpacing.cellPadding);
        
        // Add click handler for cell interaction
        cellGroup.addEventListener('click', () => handleCellAdd(i));
        
        svg.appendChild(cellGroup);
    }
    
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

function showPageSelector() {
    overlayManager.show(elements.pageSelector);
}

function hidePageSelector() {
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
