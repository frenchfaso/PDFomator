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
    
    // Add content - always as img node
    const img = document.createElement('img');
    img.src = cellData.content.src;
    img.style.objectFit = cellData.objectFit || 'contain'; // Default to contain
    img.style.cursor = 'pointer';
    img.title = `Click to cycle fill mode. Current: ${cellData.objectFit || 'contain'}`;
    
    // Add click handler to cycle through object-fit modes
    img.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent cell selection
        cycleFillMode(cellIndex);
    });
    
    cellElement.appendChild(img);
    
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

function cycleFillMode(cellIndex) {
    const cellData = layoutState.cells[cellIndex];
    if (!cellData) return;
    
    // CSS object-fit values to cycle through
    const fillModes = ['contain', 'cover', 'fill', 'scale-down', 'none'];
    const currentMode = cellData.objectFit || 'contain';
    const currentIndex = fillModes.indexOf(currentMode);
    const nextIndex = (currentIndex + 1) % fillModes.length;
    const nextMode = fillModes[nextIndex];
    
    // Update state
    cellData.objectFit = nextMode;
    
    // Re-render cell to apply new fill mode
    renderCell(cellIndex);
    
    console.log(`Cell ${cellIndex} fill mode changed from ${currentMode} to ${nextMode}`);
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
    // Check if jsPDF is available
    if (typeof window.jspdf === 'undefined') {
        throw new Error('jsPDF library not loaded');
    }
    
    try {
        // Create PDF with exact sheet dimensions
        const { width, height } = layoutState.sheet;
        const pdf = new window.jspdf.jsPDF({
            orientation: layoutState.sheet.orientation === 'portrait' ? 'p' : 'l',
            unit: 'mm',
            format: [width, height]
        });
        
        // Get actual CSS grid spacing to match the preview exactly
        const spacing = getGridSpacing();
        
        // Calculate available space after sheet padding
        const { rows, cols } = layoutState.grid;
        const availableWidth = width - spacing.sheetPadding.left - spacing.sheetPadding.right;
        const availableHeight = height - spacing.sheetPadding.top - spacing.sheetPadding.bottom;
        
        // Calculate cell dimensions accounting for gaps
        const totalGapWidth = spacing.columnGap * (cols - 1);
        const totalGapHeight = spacing.rowGap * (rows - 1);
        const cellWidth = (availableWidth - totalGapWidth) / cols;
        const cellHeight = (availableHeight - totalGapHeight) / rows;
        
        // Calculate effective content area within each cell (accounting for cell padding)
        const contentWidth = cellWidth - (spacing.cellPadding * 2);
        const contentHeight = cellHeight - (spacing.cellPadding * 2);
        
        console.log(`PDF dimensions: ${width}×${height}mm, Grid: ${cols}×${rows}`);
        console.log(`Sheet padding: ${spacing.sheetPadding.left.toFixed(1)}mm, Grid gap: ${spacing.columnGap.toFixed(1)}×${spacing.rowGap.toFixed(1)}mm, Cell padding: ${spacing.cellPadding.toFixed(1)}mm`);
        console.log(`Cell size: ${cellWidth.toFixed(1)}×${cellHeight.toFixed(1)}mm, Content area: ${contentWidth.toFixed(1)}×${contentHeight.toFixed(1)}mm`);
        
        // Process each cell that has content
        for (let i = 0; i < layoutState.cells.length; i++) {
            const cellData = layoutState.cells[i];
            if (!cellData || !cellData.content) continue;
            
            // Calculate cell position accounting for sheet padding, gaps, and cell padding
            const row = Math.floor(i / cols);
            const col = i % cols;
            
            // Cell position (including sheet padding and gaps)
            const cellX = spacing.sheetPadding.left + col * (cellWidth + spacing.columnGap);
            const cellY = spacing.sheetPadding.top + row * (cellHeight + spacing.rowGap);
            
            // Content position (cell position + cell padding)
            const contentX = cellX + spacing.cellPadding;
            const contentY = cellY + spacing.cellPadding;
            
            console.log(`Processing cell ${i} at grid (${col},${row}) -> cell coords (${cellX.toFixed(1)}, ${cellY.toFixed(1)}) -> content area (${contentX.toFixed(1)}, ${contentY.toFixed(1)})`);
            
            try {
                // Get the image data URL from the content
                const imageDataUrl = await blobToDataURL(cellData.content.src);
                
                // Load image to get natural dimensions
                const imgDimensions = await getImageDimensions(imageDataUrl);
                
                // Calculate image placement based on object-fit mode (using content area dimensions)
                const placement = calculateImagePlacement(
                    imgDimensions,
                    { width: contentWidth, height: contentHeight },
                    cellData.objectFit || 'contain'
                );
                
                // For modes that need clipping, use jsPDF clipping API
                if (cellData.objectFit === 'cover' || cellData.objectFit === 'none') {
                    // Use jsPDF clipping to contain overflow for both cover and none modes
                    pdf.saveGraphicsState();
                    pdf.rect(contentX, contentY, contentWidth, contentHeight, null);
                    pdf.clip();
                    pdf.discardPath();
                    
                    pdf.addImage(
                        imageDataUrl,
                        'JPEG',
                        contentX + placement.x,
                        contentY + placement.y,
                        placement.width,
                        placement.height
                    );
                    
                    pdf.restoreGraphicsState();
                } else {
                    // For other modes (contain, fill, scale-down), no clipping needed
                    pdf.addImage(
                        imageDataUrl,
                        'JPEG',
                        contentX + placement.x,
                        contentY + placement.y,
                        placement.width,
                        placement.height
                    );
                }
                
                console.log(`Added image to cell ${i}: ${placement.width.toFixed(1)}×${placement.height.toFixed(1)}mm at offset (${placement.x.toFixed(1)}, ${placement.y.toFixed(1)})`);
                
            } catch (error) {
                console.error(`Failed to process cell ${i}:`, error);
                // Continue with other cells
            }
        }
        
        // Generate filename with timestamp
        const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
        const filename = `pdfomator-layout-${timestamp}.pdf`;
        
        // Save the PDF
        pdf.save(filename);
        
        console.log(`PDF exported successfully: ${filename}`);
        
    } catch (error) {
        console.error('Export failed:', error);
        throw error;
    }
}

// Helper function to convert blob URL or blob to data URL
function blobToDataURL(input) {
    return new Promise((resolve, reject) => {
        // If it's already a data URL, return it directly
        if (typeof input === 'string' && input.startsWith('data:')) {
            resolve(input);
            return;
        }
        
        // If it's a blob URL, fetch it first
        if (typeof input === 'string' && input.startsWith('blob:')) {
            fetch(input)
                .then(response => response.blob())
                .then(blob => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result);
                    reader.onerror = reject;
                    reader.readAsDataURL(blob);
                })
                .catch(reject);
            return;
        }
        
        // If it's a direct blob object
        if (input instanceof Blob) {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(input);
            return;
        }
        
        // Unsupported type
        reject(new Error(`Unsupported input type: ${typeof input}`));
    });
}

// Helper function to get image natural dimensions
function getImageDimensions(dataUrl) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            resolve({
                width: img.naturalWidth,
                height: img.naturalHeight
            });
        };
        img.onerror = reject;
        img.src = dataUrl;
    });
}

// Helper function to calculate image placement based on object-fit
function calculateImagePlacement(imgDimensions, cellDimensions, objectFit) {
    const imgAspect = imgDimensions.width / imgDimensions.height;
    const cellAspect = cellDimensions.width / cellDimensions.height;
    
    // DPI conversion factors:
    // Browser CSS: 96 DPI = 25.4mm ÷ 96 = 0.264583mm per pixel
    // PDF default: 72 DPI = 25.4mm ÷ 72 = 0.352778mm per pixel
    const browserDpiToMm = 25.4 / 96; // 0.264583 - matches CSS object-fit: none behavior
    const pdfDpiToMm = 25.4 / 72; // 0.352778 - legacy for reference
    
    let width, height, x = 0, y = 0;
    
    switch (objectFit) {
        case 'fill':
            // Stretch to fill entire cell
            width = cellDimensions.width;
            height = cellDimensions.height;
            break;
            
        case 'cover':
            // Scale to cover entire cell, may crop
            if (imgAspect > cellAspect) {
                // Image is wider than cell - fit height and crop width
                height = cellDimensions.height;
                width = height * imgAspect;
                x = (cellDimensions.width - width) / 2;
            } else {
                // Image is taller than cell - fit width and crop height
                width = cellDimensions.width;
                height = width / imgAspect;
                y = (cellDimensions.height - height) / 2;
            }
            break;
            
        case 'none':
            // Use PDF DPI conversion to match jsPDF's internal scaling
            width = imgDimensions.width * pdfDpiToMm;
            height = imgDimensions.height * pdfDpiToMm;
            x = (cellDimensions.width - width) / 2;
            y = (cellDimensions.height - height) / 2;
            break;
            
        case 'scale-down':
            // Same as contain but never scale up beyond original size
            if (imgAspect > cellAspect) {
                width = cellDimensions.width;
                height = width / imgAspect;
            } else {
                height = cellDimensions.height;
                width = height * imgAspect;
            }
            
            // Don't scale up beyond original size
            const originalWidthMm = imgDimensions.width * pdfDpiToMm;
            const originalHeightMm = imgDimensions.height * pdfDpiToMm;
            
            if (width > originalWidthMm) {
                width = originalWidthMm;
                height = originalHeightMm;
            } else if (height > originalHeightMm) {
                width = originalWidthMm;
                height = originalHeightMm;
            }
            
            x = (cellDimensions.width - width) / 2;
            y = (cellDimensions.height - height) / 2;
            break;
            
        case 'contain':
        default:
            // Scale to fit entirely within cell, maintain aspect ratio
            if (imgAspect > cellAspect) {
                // Image is wider than cell - fit width
                width = cellDimensions.width;
                height = width / imgAspect;
                y = (cellDimensions.height - height) / 2;
            } else {
                // Image is taller than cell - fit height
                height = cellDimensions.height;
                width = height * imgAspect;
                x = (cellDimensions.width - width) / 2;
            }
            break;
    }
    
    return { x, y, width, height };
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

// Helper function to get actual CSS grid spacing in mm
function getGridSpacing() {
    const sheet = elements.sheet;
    const computedStyle = window.getComputedStyle(sheet);
    
    // Get CSS gap values
    const gap = computedStyle.gap;
    const rowGap = computedStyle.rowGap || computedStyle.gridRowGap || '0px';
    const columnGap = computedStyle.columnGap || computedStyle.gridColumnGap || '0px';
    
    // Get sheet padding
    const paddingTop = parseFloat(computedStyle.paddingTop) || 0;
    const paddingRight = parseFloat(computedStyle.paddingRight) || 0;
    const paddingBottom = parseFloat(computedStyle.paddingBottom) || 0;
    const paddingLeft = parseFloat(computedStyle.paddingLeft) || 0;
    
    // Parse gap values - handle both shorthand and individual properties
    let parsedRowGap, parsedColumnGap;
    
    if (gap && gap !== 'normal' && gap !== '0px') {
        // Shorthand 'gap' property - could be "10px" or "10px 15px"
        const gapValues = gap.split(' ');
        parsedRowGap = parseFloat(gapValues[0]);
        parsedColumnGap = parseFloat(gapValues[1] || gapValues[0]);
    } else {
        // Individual properties
        parsedRowGap = parseFloat(rowGap);
        parsedColumnGap = parseFloat(columnGap);
    }
    
    // Get cell padding by checking a filled cell (if any exists)
    let cellPadding = 0;
    const filledCell = sheet.querySelector('.sheet-cell.filled');
    if (filledCell) {
        const cellStyle = window.getComputedStyle(filledCell);
        // Use the maximum padding value (they should be the same in our case)
        cellPadding = Math.max(
            parseFloat(cellStyle.paddingTop) || 0,
            parseFloat(cellStyle.paddingRight) || 0,
            parseFloat(cellStyle.paddingBottom) || 0,
            parseFloat(cellStyle.paddingLeft) || 0
        );
    } else {
        // Fallback: create a temporary filled cell to measure
        const tempCell = document.createElement('div');
        tempCell.className = 'sheet-cell filled';
        tempCell.style.visibility = 'hidden';
        tempCell.style.position = 'absolute';
        sheet.appendChild(tempCell);
        const tempStyle = window.getComputedStyle(tempCell);
        cellPadding = parseFloat(tempStyle.paddingTop) || 0;
        sheet.removeChild(tempCell);
    }
    
    // Convert from pixels to mm using PDF DPI conversion to match jsPDF
    const pdfDpiToMm = 25.4 / 72; // 0.352778 - matches jsPDF's internal scaling
    
    return {
        rowGap: (parsedRowGap || 0) * pdfDpiToMm,
        columnGap: (parsedColumnGap || 0) * pdfDpiToMm,
        sheetPadding: {
            top: paddingTop * pdfDpiToMm,
            right: paddingRight * pdfDpiToMm,
            bottom: paddingBottom * pdfDpiToMm,
            left: paddingLeft * pdfDpiToMm
        },
        cellPadding: cellPadding * pdfDpiToMm
    };
}

// Helper function to crop image for cover mode
// End of file
