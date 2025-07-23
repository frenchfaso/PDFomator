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
    pdfWorkerUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
};

// Overlay management utilities
const overlayManager = {
    show(element, onShow = null) {
        element.classList.remove('hidden');
        if (onShow) onShow();
    },
    
    hide(element, onHide = null) {
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

// Initialize the application
document.addEventListener('DOMContentLoaded', init);

// Global error boundary
window.addEventListener('error', (event) => {
    console.error('Global error caught:', event.error);
    hideLoading(); // Hide any loading states
    alert('An unexpected error occurred. Please refresh the page and try again.');
});

// Global promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
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
    
    console.log('PDFomator initialized');
}

function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js')
            .then(registration => {
                console.log('Service Worker registered:', registration);
            })
            .catch(error => {
                console.log('Service Worker registration failed:', error);
            });
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

async function setupPDFWorker() {
    try {
        // PDF.js is loaded globally from the script tag
        if (typeof pdfjsLib !== 'undefined') {
            pdfjsLib.GlobalWorkerOptions.workerSrc = CONFIG.pdfWorkerUrl;
            console.log('PDF.js worker configured');
        }
    } catch (error) {
        console.warn('PDF.js not available:', error);
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
        console.log('PDF button clicked, currentTargetCell:', currentTargetCell);
        hideFileTypeSelector();
        elements.pdfInput.click();
    });
    elements.selectImageBtn.addEventListener('click', () => {
        console.log('Image button clicked, currentTargetCell:', currentTargetCell);
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
    console.log('handleCellAdd called with cellIndex:', cellIndex);
    currentTargetCell = cellIndex;
    console.log('currentTargetCell set to:', currentTargetCell);
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
    
    showLoading('Creating PDF...');
    
    try {
        await exportToPDF();
    } catch (error) {
        console.error('Export failed:', error);
        alert('Export failed. Please try again.');
    } finally {
        hideLoading();
    }
}

async function handlePDFSelection(e) {
    const files = Array.from(e.target.files);
    if (files.length === 0 || currentTargetCell === null) return;
    
    const file = files[0]; // Single file selection
    showLoading('Processing PDF...');
    
    try {
        await processPDFFileForCell(file, currentTargetCell);
    } catch (error) {
        console.error('PDF processing failed:', error);
        alert('Failed to process PDF. Please try again.');
    } finally {
        hideLoading();
        elements.pdfInput.value = '';
        currentTargetCell = null;
    }
}

async function handleImageSelection(e) {
    console.log('handleImageSelection called', {
        filesCount: e.target.files.length,
        currentTargetCell,
        files: Array.from(e.target.files)
    });
    
    const files = Array.from(e.target.files);
    if (files.length === 0) {
        console.log('No files selected');
        return;
    }
    
    if (currentTargetCell === null) {
        console.log('No target cell set');
        return;
    }
    
    const file = files[0]; // Single file selection
    console.log('Processing file:', file.name, file.type);
    showLoading('Processing image...');
    
    try {
        await processImageFileForCell(file, currentTargetCell);
        console.log('Image processing completed successfully');
    } catch (error) {
        console.error('Image processing failed:', error);
        alert('Failed to process image. Please try again.');
    } finally {
        hideLoading();
        elements.imageInput.value = '';
        currentTargetCell = null;
    }
}

async function processPDFFileForCell(file, cellIndex) {
    if (typeof pdfjsLib === 'undefined') {
        throw new Error('PDF.js not available');
    }
    
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
    
    if (pdf.numPages === 1) {
        // Single page - process directly
        const page = await pdf.getPage(1);
        const bitmap = await renderPDFPageToBitmap(page);
        addToSpecificCell(bitmap, `${file.name} p1`, cellIndex);
    } else {
        // Multiple pages - show page selector
        await showPDFPageSelector(pdf, file.name, cellIndex);
    }
}

async function processImageFileForCell(file, cellIndex) {
    console.log('processImageFileForCell called:', {
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        cellIndex
    });
    
    return new Promise((resolve, reject) => {
        const img = new Image();
        const objectUrl = URL.createObjectURL(file);
        
        console.log('Created object URL:', objectUrl);
        
        img.onload = () => {
            console.log('Image loaded successfully:', {
                naturalWidth: img.naturalWidth,
                naturalHeight: img.naturalHeight
            });
            
            // Use the image directly instead of converting to bitmap
            // This preserves the original quality and format
            addToSpecificCell(img, file.name, cellIndex);
            console.log('Added to cell:', cellIndex);
            
            // Don't revoke the URL immediately since the img element needs it
            // The browser will clean it up when the img is garbage collected
            resolve();
        };
        
        img.onerror = (error) => {
            console.error('Image loading failed:', error);
            URL.revokeObjectURL(objectUrl); // Clean up memory on error
            reject(new Error('Failed to load image'));
        };
        
        img.src = objectUrl;
        console.log('Set image src to object URL');
    });
}

function convertImageToBitmap(img, quality = 0.9) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    
    ctx.drawImage(img, 0, 0);
    
    // Convert to JPEG bitmap
    const dataUrl = canvas.toDataURL('image/jpeg', quality);
    const bitmap = new Image();
    bitmap.src = dataUrl;
    
    return bitmap;
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
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        const bitmap = new Image();
        bitmap.src = dataUrl;
        return bitmap;
    }
    
    return canvas;
}

async function renderPDFPageToBitmap(page, quality = 0.9) {
    return await renderPDFPage(page, 2, 'bitmap');
}

async function renderPDFPageToCanvas(page, scale = 2) {
    return await renderPDFPage(page, scale, 'canvas');
}

async function showPDFPageSelector(pdf, fileName, cellIndex) {
    const pageGrid = elements.pageGrid;
    pageGrid.innerHTML = '';
    
    // Render thumbnails for all pages
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const thumbnail = await renderPDFPageToCanvas(page, 0.5); // Smaller scale for thumbnails
        
        const pageDiv = document.createElement('div');
        pageDiv.className = 'page-thumbnail';
        pageDiv.dataset.pageNum = pageNum;
        
        const label = document.createElement('div');
        label.className = 'page-label';
        label.textContent = `Page ${pageNum}`;
        
        pageDiv.appendChild(thumbnail);
        pageDiv.appendChild(label);
        
        pageDiv.addEventListener('click', async () => {
            hidePageSelector();
            showLoading('Processing selected page...');
            
            try {
                const selectedPage = await pdf.getPage(pageNum);
                const bitmap = await renderPDFPageToBitmap(selectedPage);
                addToSpecificCell(bitmap, `${fileName} p${pageNum}`, cellIndex);
            } catch (error) {
                console.error('Failed to process selected page:', error);
                alert('Failed to process selected page.');
            } finally {
                hideLoading();
            }
        });
        
        pageGrid.appendChild(pageDiv);
    }
    
    showPageSelector();
}

function addToSpecificCell(content, title = '', cellIndex) {
    // Store in state
    layoutState.cells[cellIndex] = { content, title };
    
    // Update UI
    renderCell(cellIndex);
    
    console.log(`Added content to cell ${cellIndex}: ${title}`);
}

function renderCell(cellIndex) {
    const cellElement = elements.sheet.children[cellIndex];
    if (!cellElement) {
        console.log('Cell element not found for index:', cellIndex);
        return;
    }
    
    const cellData = layoutState.cells[cellIndex];
    if (!cellData) {
        // Clear cell and add the add button
        cellElement.innerHTML = '';
        cellElement.classList.remove('filled');
        
        const addBtn = document.createElement('button');
        addBtn.className = 'add-btn';
        addBtn.textContent = '+';
        addBtn.title = 'Add content to this cell';
        addBtn.addEventListener('click', () => {
            console.log('Add button clicked for cell:', cellIndex);
            handleCellAdd(cellIndex);
        });
        cellElement.appendChild(addBtn);
        
        console.log(`Rendered empty cell ${cellIndex} with add button`);
        return;
    }
    
    // Clear existing content
    cellElement.innerHTML = '';
    cellElement.classList.add('filled');
    
    console.log(`Rendering filled cell ${cellIndex} with content:`, cellData.title);
    
    // Add content
    if (cellData.content instanceof HTMLCanvasElement) {
        const canvas = cellData.content.cloneNode();
        cellElement.appendChild(canvas);
    } else if (cellData.content instanceof Image) {
        const img = document.createElement('img');
        img.src = cellData.content.src;
        cellElement.appendChild(img);
    }
    
    // Add remove button
    const removeBtn = document.createElement('button');
    removeBtn.className = 'remove-btn';
    removeBtn.textContent = '×';
    removeBtn.title = `Remove ${cellData.title}`;
    removeBtn.addEventListener('click', () => removeCellContent(cellIndex));
    cellElement.appendChild(removeBtn);
}

function removeCellContent(cellIndex) {
    layoutState.cells[cellIndex] = null;
    renderCell(cellIndex);
    console.log(`Removed content from cell ${cellIndex}`);
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
    
    console.log(`Paper size: ${layoutState.sheet.paperSize} ${layoutState.sheet.orientation}`);
    console.log(`Dimensions: ${layoutState.sheet.width} × ${layoutState.sheet.height}mm`);
}

function updateSheetGrid() {
    const { rows, cols } = layoutState.grid;
    
    // Update CSS Grid
    elements.sheet.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    elements.sheet.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
    
    // Clear existing cells
    elements.sheet.innerHTML = '';
    
    // Create new cells
    const totalCells = rows * cols;
    for (let i = 0; i < totalCells; i++) {
        const cell = document.createElement('div');
        cell.className = 'sheet-cell';
        cell.dataset.cellIndex = i;
        elements.sheet.appendChild(cell);
        
        // Render existing content if any
        renderCell(i);
    }
    
    console.log(`Grid updated: ${cols} × ${rows} (${totalCells} cells)`);
}

function setupGridMatrix() {
    const matrix = elements.gridMatrix;
    matrix.innerHTML = '';
    
    // Create 5x5 grid of selectable cells
    for (let row = 1; row <= CONFIG.maxGridSize; row++) {
        for (let col = 1; col <= CONFIG.maxGridSize; col++) {
            const cell = document.createElement('div');
            cell.className = 'grid-cell';
            cell.dataset.row = row;
            cell.dataset.col = col;
            
            // Event handlers for grid selection
            cell.addEventListener('mouseenter', () => highlightGridArea(col, row));
            cell.addEventListener('click', () => selectGrid(col, row));
            
            matrix.appendChild(cell);
        }
    }
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
    layoutState.grid.cols = cols;
    layoutState.grid.rows = rows;
    
    // Clear cells that are outside new grid
    const totalCells = rows * cols;
    layoutState.cells = layoutState.cells.slice(0, totalCells);
    
    updateSheetGrid();
    hideGridPicker();
    
    console.log(`Grid selected: ${cols} × ${rows}`);
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
            
            console.log(`Selected: ${size} ${orientation}`);
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
    overlayManager.show(elements.loading, () => {
        const loadingText = elements.loading.querySelector('p');
        if (loadingText) loadingText.textContent = message;
    });
}

function hideLoading() {
    overlayManager.hide(elements.loading);
}

async function exportToPDF() {
    // Check if libraries are available
    if (typeof html2canvas === 'undefined' || typeof jsPDF === 'undefined') {
        throw new Error('Required libraries not loaded');
    }
    
    // Capture the sheet at high resolution
    const canvas = await html2canvas(elements.sheet, {
        scale: 3, // 288 DPI (96 * 3)
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
    });
    
    // Create PDF
    const { width, height } = layoutState.sheet;
    const pdf = new jsPDF.jsPDF({
        orientation: layoutState.sheet.orientation === 'portrait' ? 'p' : 'l',
        unit: 'mm',
        format: [width, height]
    });
    
    // Add the canvas as an image to fill the entire page
    const imgData = canvas.toDataURL('image/png');
    pdf.addImage(imgData, 'PNG', 0, 0, width, height);
    
    // Generate filename with timestamp
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
    const filename = `pdfomator-layout-${timestamp}.pdf`;
    
    // Save the PDF
    pdf.save(filename);
    
    console.log(`PDF exported: ${filename}`);
}

// Export for debugging
window.PDFomator = {
    layoutState,
    CONFIG,
    elements,
    updateSheetGrid,
    exportToPDF
};

// TODO: Future enhancements
// - Vector export via pdf-lib instead of raster
// - Pinch-to-zoom on mobile devices  
// - Dark mode theme toggle
// - Custom paper sizes
// - Page rotation controls
// - Batch processing of multiple PDFs
// - Cloud storage integration
// - Annotation tools
// - Print optimization
// - Template saving/loading
