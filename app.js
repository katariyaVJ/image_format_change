/**
 * OmniConvert Studio - Universal Image Converter & Batch Optimizer
 * 100% Client-Side, High Performance, Privacy-First
 */

// Application State
const state = {
  items: [],
  isProcessing: false,
  selectedIds: new Set(),
  activeTheme: localStorage.getItem('omni_theme') || 'light',
  viewMode: 'grid',
  searchQuery: '',
  aspectRatioLocked: true,
  lastCustomRatio: null
};

// Format configuration
const FORMAT_CONFIG = {
  'image/webp': { ext: 'webp', name: 'WebP', desc: 'Best for modern web: up to 30% smaller than JPG with transparency.' },
  'image/png': { ext: 'png', name: 'PNG', desc: 'Lossless quality with full alpha transparency support.' },
  'image/jpeg': { ext: 'jpg', name: 'JPG / JPEG', desc: 'Standard photo format, customizable compression & fill.' },
  'image/avif': { ext: 'avif', name: 'AVIF', desc: 'Next-gen image codec with ultra high compression.' },
  'image/bmp': { ext: 'bmp', name: 'BMP', desc: 'Uncompressed raw bitmap format (high fidelity).' },
  'image/x-icon': { ext: 'ico', name: 'ICO', desc: 'Standard website favicon and Windows application icon.' }
};

// DOM References
const themeToggle = document.getElementById('themeToggle');
const themeIconSun = document.getElementById('themeIconSun');
const themeIconMoon = document.getElementById('themeIconMoon');

const targetFormatSelect = document.getElementById('targetFormat');
const targetFormatBadge = document.getElementById('targetFormatBadge');
const formatDescription = document.getElementById('formatDescription');
const qualityRange = document.getElementById('qualityRange');
const qualityVal = document.getElementById('qualityVal');
const presetBtns = document.querySelectorAll('.preset-btn');
const resizeModeSelect = document.getElementById('resizeMode');
const resizeBadge = document.getElementById('resizeBadge');
const customDimsRow = document.getElementById('customDimsRow');
const customWidthInput = document.getElementById('customWidth');
const customHeightInput = document.getElementById('customHeight');
const btnAspectRatioLock = document.getElementById('btnAspectRatioLock');
const bgFillColorInput = document.getElementById('bgFillColor');
const bgFillText = document.getElementById('bgFillText');
const filenameSuffixInput = document.getElementById('filenameSuffix');

const dropZone = document.getElementById('dropZone');
const globalDropOverlay = document.getElementById('globalDropOverlay');
const fileInputFiles = document.getElementById('fileInputFiles');
const fileInputFolder = document.getElementById('fileInputFolder');
const btnSelectFiles = document.getElementById('btnSelectFiles');
const btnSelectFolder = document.getElementById('btnSelectFolder');
const btnAddMore = document.getElementById('btnAddMore');

const batchToolbar = document.getElementById('batchToolbar');
const totalCountElem = document.getElementById('totalCount');
const convertedCountElem = document.getElementById('convertedCount');
const savedSizeTextElem = document.getElementById('savedSizeText');
const savedBytesTextElem = document.getElementById('savedBytesText');
const progressContainer = document.getElementById('progressContainer');
const progressBarFill = document.getElementById('progressBarFill');
const progressText = document.getElementById('progressText');
const progressPercent = document.getElementById('progressPercent');

const btnSaveToFolder = document.getElementById('btnSaveToFolder');
const btnDownloadZip = document.getElementById('btnDownloadZip');
const btnDownloadDirect = document.getElementById('btnDownloadDirect');
const btnClearAll = document.getElementById('btnClearAll');

const selectAllCheckbox = document.getElementById('selectAllCheckbox');
const selectedCountText = document.getElementById('selectedCountText');
const btnDownloadSelected = document.getElementById('btnDownloadSelected');
const btnDeleteSelected = document.getElementById('btnDeleteSelected');
const searchInput = document.getElementById('searchInput');
const viewBtnGrid = document.getElementById('viewBtnGrid');
const viewBtnList = document.getElementById('viewBtnList');

const itemsContainer = document.getElementById('itemsContainer');
const emptySearchState = document.getElementById('emptySearchState');
const toastContainer = document.getElementById('toastContainer');

// Modal Elements
const compareModal = document.getElementById('compareModal');
const btnCloseModal = document.getElementById('btnCloseModal');
const btnModalClose = document.getElementById('btnModalClose');
const modalImageName = document.getElementById('modalImageName');
const modalMetaInfo = document.getElementById('modalMetaInfo');
const modalOrigImg = document.getElementById('modalOrigImg');
const modalConvImg = document.getElementById('modalConvImg');
const modalOrigMeta = document.getElementById('modalOrigMeta');
const modalConvMeta = document.getElementById('modalConvMeta');
const modalStatsSavings = document.getElementById('modalStatsSavings');
const btnModalDownload = document.getElementById('btnModalDownload');

// ==========================================================================
// Initialization & Theme
// ==========================================================================
function initTheme() {
  document.documentElement.setAttribute('data-theme', state.activeTheme);
  if (state.activeTheme === 'dark') {
    themeIconSun.classList.remove('hidden');
    themeIconMoon.classList.add('hidden');
  } else {
    themeIconSun.classList.add('hidden');
    themeIconMoon.classList.remove('hidden');
  }
}

themeToggle.addEventListener('click', () => {
  state.activeTheme = state.activeTheme === 'light' ? 'dark' : 'light';
  localStorage.setItem('omni_theme', state.activeTheme);
  initTheme();
  showToast(`Switched to ${state.activeTheme} mode`, 'info');
});

initTheme();

// ==========================================================================
// Settings Listeners
// ==========================================================================
targetFormatSelect.addEventListener('change', () => {
  const mime = targetFormatSelect.value;
  const conf = FORMAT_CONFIG[mime] || { ext: 'webp', name: 'WebP', desc: '' };
  targetFormatBadge.textContent = conf.ext.toUpperCase();
  formatDescription.textContent = conf.desc;

  // Visual cues for lossless or uncompressed formats
  if (mime === 'image/png') {
    qualityRange.disabled = true;
    qualityRange.style.opacity = '0.45';
    qualityVal.textContent = 'Lossless';
    presetBtns.forEach(b => b.disabled = true);
  } else if (mime === 'image/bmp') {
    qualityRange.disabled = true;
    qualityRange.style.opacity = '0.45';
    qualityVal.textContent = 'Uncompressed';
    presetBtns.forEach(b => b.disabled = true);
  } else {
    qualityRange.disabled = false;
    qualityRange.style.opacity = '1';
    qualityVal.textContent = `${qualityRange.value}%`;
    presetBtns.forEach(b => b.disabled = false);
  }

  reprocessAll();
});

qualityRange.addEventListener('input', (e) => {
  const val = e.target.value;
  qualityVal.textContent = `${val}%`;
  presetBtns.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.quality === val);
  });
});

qualityRange.addEventListener('change', reprocessAll);

presetBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const q = btn.dataset.quality;
    qualityRange.value = q;
    qualityVal.textContent = `${q}%`;
    presetBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    reprocessAll();
  });
});

resizeModeSelect.addEventListener('change', () => {
  const mode = resizeModeSelect.value;
  if (mode === 'custom') {
    customDimsRow.classList.remove('hidden');
    resizeBadge.textContent = 'Custom';
  } else {
    customDimsRow.classList.add('hidden');
    resizeBadge.textContent = resizeModeSelect.options[resizeModeSelect.selectedIndex].text.split('(')[0].trim();
  }
  reprocessAll();
});

btnAspectRatioLock.addEventListener('click', () => {
  state.aspectRatioLocked = !state.aspectRatioLocked;
  btnAspectRatioLock.classList.toggle('active', state.aspectRatioLocked);
});

customWidthInput.addEventListener('input', () => {
  if (state.aspectRatioLocked && state.lastCustomRatio && customWidthInput.value) {
    customHeightInput.value = Math.round(customWidthInput.value / state.lastCustomRatio);
  }
});

customHeightInput.addEventListener('input', () => {
  if (state.aspectRatioLocked && state.lastCustomRatio && customHeightInput.value) {
    customWidthInput.value = Math.round(customHeightInput.value * state.lastCustomRatio);
  }
});

[customWidthInput, customHeightInput].forEach(inp => {
  inp.addEventListener('change', reprocessAll);
});

bgFillColorInput.addEventListener('input', (e) => {
  bgFillText.textContent = e.target.value.toUpperCase();
});

bgFillColorInput.addEventListener('change', reprocessAll);
filenameSuffixInput.addEventListener('change', reprocessAll);

// ==========================================================================
// File Input & Drag & Drop Handling
// ==========================================================================
btnSelectFiles.addEventListener('click', (e) => {
  e.stopPropagation();
  fileInputFiles.click();
});

btnSelectFolder.addEventListener('click', (e) => {
  e.stopPropagation();
  fileInputFolder.click();
});

if (btnAddMore) {
  btnAddMore.addEventListener('click', () => {
    fileInputFiles.click();
  });
}

dropZone.addEventListener('click', () => {
  fileInputFiles.click();
});

fileInputFiles.addEventListener('change', (e) => {
  handleFileList(Array.from(e.target.files));
  fileInputFiles.value = '';
});

fileInputFolder.addEventListener('change', (e) => {
  handleFileList(Array.from(e.target.files));
  fileInputFolder.value = '';
});

// Dropzone card drag events
['dragenter', 'dragover'].forEach(name => {
  dropZone.addEventListener(name, (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropZone.classList.add('drag-over');
  });
});

['dragleave', 'drop'].forEach(name => {
  dropZone.addEventListener(name, (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropZone.classList.remove('drag-over');
  });
});

// Full Window Drag and Drop
let dragCounter = 0;

window.addEventListener('dragenter', (e) => {
  e.preventDefault();
  dragCounter++;
  if (e.dataTransfer && e.dataTransfer.types && e.dataTransfer.types.includes('Files')) {
    globalDropOverlay.classList.remove('hidden');
  }
});

window.addEventListener('dragleave', (e) => {
  e.preventDefault();
  dragCounter--;
  if (dragCounter <= 0) {
    dragCounter = 0;
    globalDropOverlay.classList.add('hidden');
  }
});

window.addEventListener('dragover', (e) => {
  e.preventDefault();
});

window.addEventListener('drop', (e) => {
  e.preventDefault();
  dragCounter = 0;
  globalDropOverlay.classList.add('hidden');
  handleDataTransfer(e.dataTransfer);
});

// Clipboard paste (Ctrl+V) anywhere on the page
window.addEventListener('paste', (e) => {
  const items = e.clipboardData && e.clipboardData.items;
  if (!items) return;

  const pastedFiles = [];
  for (let i = 0; i < items.length; i++) {
    if (items[i].type.startsWith('image/')) {
      const file = items[i].getAsFile();
      if (file) {
        // Name with timestamp if pasted screenshot
        const namedFile = new File([file], `pasted_image_${Date.now()}.png`, { type: file.type });
        pastedFiles.push(namedFile);
      }
    }
  }

  if (pastedFiles.length > 0) {
    showToast(`Pasted ${pastedFiles.length} image from clipboard!`, 'info');
    handleFileList(pastedFiles);
  }
});

// Extract files from DataTransfer (single files, multiple files, or folders)
async function handleDataTransfer(dataTransfer) {
  if (!dataTransfer) return;

  if (dataTransfer.items && dataTransfer.items.length > 0) {
    const queue = [];
    for (let i = 0; i < dataTransfer.items.length; i++) {
      const item = dataTransfer.items[i];
      if (item.webkitGetAsEntry) {
        const entry = item.webkitGetAsEntry();
        if (entry) queue.push(traverseDirectoryTree(entry));
      } else {
        const file = item.getAsFile();
        if (file && isImageFile(file)) {
          queue.push(Promise.resolve([file]));
        }
      }
    }

    if (queue.length > 0) {
      const nested = await Promise.all(queue);
      const flat = nested.flat().filter(f => f && isImageFile(f));
      if (flat.length > 0) {
        handleFileList(flat);
        return;
      }
    }
  }

  if (dataTransfer.files && dataTransfer.files.length > 0) {
    const files = Array.from(dataTransfer.files).filter(isImageFile);
    handleFileList(files);
  }
}

// Traverse folders recursively with chunked reader
async function traverseDirectoryTree(entry) {
  if (entry.isFile) {
    return new Promise(resolve => {
      entry.file(
        file => resolve([file]),
        () => resolve([])
      );
    });
  } else if (entry.isDirectory) {
    try {
      const dirReader = entry.createReader();
      const entries = [];
      let readResults = await new Promise(res => dirReader.readEntries(res, () => res([])));
      while (readResults.length > 0) {
        entries.push(...readResults);
        readResults = await new Promise(res => dirReader.readEntries(res, () => res([])));
      }
      const nested = await Promise.all(entries.map(traverseDirectoryTree));
      return nested.flat();
    } catch (e) {
      console.warn('Error reading directory:', e);
      return [];
    }
  }
  return [];
}

function isImageFile(file) {
  if (!file) return false;
  if (file.type && file.type.startsWith('image/')) return true;
  return /\.(png|jpe?g|webp|avif|bmp|gif|svg|ico|tiff?)$/i.test(file.name);
}

// ==========================================================================
// Handling Added Files
// ==========================================================================
async function handleFileList(newFiles) {
  const validFiles = newFiles.filter(isImageFile);
  if (validFiles.length === 0) {
    showToast('No valid image files found.', 'warning');
    return;
  }

  batchToolbar.classList.remove('hidden');

  const newItems = [];
  for (const file of validFiles) {
    const id = 'img_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
    const item = {
      id,
      file,
      originalName: file.name,
      originalSize: file.size,
      originalWidth: 0,
      originalHeight: 0,
      originalSrc: URL.createObjectURL(file),
      convertedBlob: null,
      convertedUrl: null,
      convertedSize: 0,
      convertedWidth: 0,
      convertedHeight: 0,
      convertedName: '',
      targetFormatOverride: null, // can override per item
      status: 'pending'
    };

    state.items.push(item);
    state.selectedIds.add(id);
    newItems.push(item);
    renderItemCard(item);
  }

  updateBatchStats();
  updateSelectionUi();
  showToast(`Added ${newItems.length} image${newItems.length > 1 ? 's' : ''}`, 'info');

  processQueue();
}

// Re-process all items (e.g. after global settings change)
function reprocessAll() {
  if (state.items.length === 0) return;
  state.items.forEach(item => {
    item.status = 'pending';
    item.convertedBlob = null;
    if (item.convertedUrl) URL.revokeObjectURL(item.convertedUrl);
    item.convertedUrl = null;
    updateCardElement(item);
  });
  updateBatchStats();
  processQueue();
}

// Re-process single item
function reprocessItem(id) {
  const item = state.items.find(i => i.id === id);
  if (!item) return;
  item.status = 'pending';
  item.convertedBlob = null;
  if (item.convertedUrl) URL.revokeObjectURL(item.convertedUrl);
  item.convertedUrl = null;
  updateCardElement(item);
  processQueue();
}

// ==========================================================================
// Conversion Queue & Worker Loop (Dynamic Loop)
// ==========================================================================
async function processQueue() {
  if (state.isProcessing) return;
  state.isProcessing = true;

  progressContainer.classList.remove('hidden');

  while (true) {
    const item = state.items.find(i => i.status === 'pending');
    if (!item) break;

    item.status = 'converting';
    updateCardElement(item);

    try {
      await convertSingleImage(item);
      item.status = 'done';
    } catch (err) {
      console.error('Conversion failed for item:', item.originalName, err);
      item.status = 'error';
    }

    const total = state.items.length;
    const finishedCount = state.items.filter(i => i.status === 'done' || i.status === 'error').length;
    const percent = total > 0 ? Math.round((finishedCount / total) * 100) : 100;
    progressBarFill.style.width = `${percent}%`;
    progressPercent.textContent = `${percent}%`;
    progressText.textContent = `Converting ${finishedCount} of ${total}...`;

    updateCardElement(item);
    updateBatchStats();
  }

  setTimeout(() => {
    if (!state.items.some(i => i.status === 'pending')) {
      progressContainer.classList.add('hidden');
      progressBarFill.style.width = '0%';
    }
  }, 1000);

  state.isProcessing = false;
}

// ==========================================================================
// Accurate Core Image Conversion Engine
// ==========================================================================
async function convertSingleImage(item) {
  // 1. Decode image with EXIF orientation correction
  const { source, width: origW, height: origH } = await loadImageSource(item);
  item.originalWidth = origW;
  item.originalHeight = origH;

  if (!state.lastCustomRatio && origW && origH) {
    state.lastCustomRatio = origW / origH;
    if (!customWidthInput.value && !customHeightInput.value) {
      customWidthInput.value = origW;
      customHeightInput.value = origH;
    }
  }

  // 2. Compute target dimensions
  const { targetWidth, targetHeight } = calculateDimensions(origW, origH);
  item.convertedWidth = targetWidth;
  item.convertedHeight = targetHeight;

  // 3. Render onto high-precision Canvas
  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d', { alpha: true });

  // Use high quality image interpolation
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Determine target format
  const targetMime = item.targetFormatOverride || targetFormatSelect.value;
  const quality = parseInt(qualityRange.value, 10) / 100;

  // Background fill for opaque formats (JPG / BMP)
  if (targetMime === 'image/jpeg' || targetMime === 'image/bmp') {
    ctx.fillStyle = bgFillColorInput.value || '#ffffff';
    ctx.fillRect(0, 0, targetWidth, targetHeight);
  }

  // Draw source image onto canvas
  ctx.drawImage(source, 0, 0, targetWidth, targetHeight);

  // Close ImageBitmap to free memory if applicable
  if (source.close) {
    source.close();
  }

  // 4. Encode to target format Blob
  const blob = await encodeCanvasToBlob(canvas, targetMime, quality);
  if (!blob) {
    throw new Error(`Failed to encode image to ${targetMime}`);
  }

  // 5. Generate output filename
  const baseName = getBaseName(item.originalName);
  const ext = FORMAT_CONFIG[targetMime]?.ext || 'webp';
  const suffix = filenameSuffixInput.value.trim();
  const convertedName = `${baseName}${suffix}.${ext}`;

  item.convertedBlob = blob;
  item.convertedSize = blob.size;
  if (item.convertedUrl) URL.revokeObjectURL(item.convertedUrl);
  item.convertedUrl = URL.createObjectURL(blob);
  item.convertedName = convertedName;
}

// Decode image source using createImageBitmap with EXIF orientation handling, with fallback to HTMLImageElement
async function loadImageSource(item) {
  // Attempt modern createImageBitmap with EXIF auto-orientation
  if ('createImageBitmap' in window) {
    try {
      const bitmap = await createImageBitmap(item.file, { imageOrientation: 'from-image' });
      return { source: bitmap, width: bitmap.width, height: bitmap.height };
    } catch (e) {
      // SVG or certain formats might reject createImageBitmap, fallback to Image()
    }
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      resolve({ source: img, width: img.naturalWidth || img.width, height: img.naturalHeight || img.height });
    };
    img.onerror = () => reject(new Error('Failed to load image element'));
    img.src = item.originalSrc;
  });
}

// Compute scaling & dimensions
function calculateDimensions(origW, origH) {
  const mode = resizeModeSelect.value;

  if (mode === 'original' || !origW || !origH) {
    return { targetWidth: origW, targetHeight: origH };
  }

  if (mode.startsWith('scale_')) {
    const factor = parseInt(mode.replace('scale_', ''), 10) / 100;
    return {
      targetWidth: Math.max(1, Math.round(origW * factor)),
      targetHeight: Math.max(1, Math.round(origH * factor))
    };
  }

  if (mode.startsWith('max_')) {
    const maxDim = parseInt(mode.replace('max_', ''), 10);
    if (origW > maxDim || origH > maxDim) {
      if (origW > origH) {
        return {
          targetWidth: maxDim,
          targetHeight: Math.max(1, Math.round((origH * maxDim) / origW))
        };
      } else {
        return {
          targetWidth: Math.max(1, Math.round((origW * maxDim) / origH)),
          targetHeight: maxDim
        };
      }
    }
    return { targetWidth: origW, targetHeight: origH };
  }

  if (mode === 'custom') {
    const w = parseInt(customWidthInput.value, 10);
    const h = parseInt(customHeightInput.value, 10);
    if (w > 0 && h > 0) {
      return { targetWidth: w, targetHeight: h };
    }
    if (w > 0) {
      return { targetWidth: w, targetHeight: Math.max(1, Math.round((origH * w) / origW)) };
    }
    if (h > 0) {
      return { targetWidth: Math.max(1, Math.round((origW * h) / origH)), targetHeight: h };
    }
  }

  return { targetWidth: origW, targetHeight: origH };
}

// Encode canvas to Blob (supports WebP, PNG, JPEG, AVIF, BMP, ICO)
async function encodeCanvasToBlob(canvas, mimeType, quality) {
  // 1. Pure client-side BMP Encoder
  if (mimeType === 'image/bmp') {
    return encodeCanvasToBmp(canvas);
  }

  // 2. Pure client-side ICO Encoder
  if (mimeType === 'image/x-icon') {
    return encodeCanvasToIco(canvas);
  }

  // 3. Native canvas toBlob (WebP, PNG, JPEG, AVIF)
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      // If browser doesn't support requested format (e.g. AVIF on older browser), fallback cleanly
      if (blob) {
        resolve(blob);
      } else {
        // Fallback to WebP or PNG
        canvas.toBlob(resolve, 'image/webp', quality);
      }
    }, mimeType, quality);
  });
}

// Pure JS BMP (24-bit bitmap) generator
function encodeCanvasToBmp(canvas) {
  const width = canvas.width;
  const height = canvas.height;
  const ctx = canvas.getContext('2d');
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  const rowSize = Math.floor((24 * width + 31) / 32) * 4;
  const pixelArraySize = rowSize * height;
  const fileSize = 54 + pixelArraySize;

  const buffer = new ArrayBuffer(fileSize);
  const view = new DataView(buffer);

  // BITMAPFILEHEADER (14 bytes)
  view.setUint16(0, 0x4D42, false); // 'BM'
  view.setUint32(2, fileSize, true);
  view.setUint16(6, 0, true);
  view.setUint16(8, 0, true);
  view.setUint32(10, 54, true);

  // BITMAPINFOHEADER (40 bytes)
  view.setUint32(14, 40, true);
  view.setInt32(18, width, true);
  view.setInt32(22, height, true); // bottom-up
  view.setUint16(26, 1, true);
  view.setUint16(28, 24, true);
  view.setUint32(30, 0, true);
  view.setUint32(34, pixelArraySize, true);
  view.setInt32(38, 2835, true);
  view.setInt32(42, 2835, true);
  view.setUint32(46, 0, true);
  view.setUint32(50, 0, true);

  // Pixel data (BGR bottom-up)
  let offset = 54;
  for (let y = height - 1; y >= 0; y--) {
    const rowStart = offset;
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      view.setUint8(offset++, b);
      view.setUint8(offset++, g);
      view.setUint8(offset++, r);
    }
    while ((offset - rowStart) % 4 !== 0) {
      view.setUint8(offset++, 0);
    }
  }

  return new Blob([buffer], { type: 'image/bmp' });
}

// Pure JS ICO generator (standard Windows ICO container wrapping PNG payload)
async function encodeCanvasToIco(canvas) {
  const pngBlob = await new Promise(res => canvas.toBlob(res, 'image/png'));
  const pngBytes = new Uint8Array(await pngBlob.arrayBuffer());

  const w = canvas.width > 255 ? 0 : canvas.width;
  const h = canvas.height > 255 ? 0 : canvas.height;
  const totalSize = 6 + 16 + pngBytes.length;

  const buffer = new ArrayBuffer(totalSize);
  const view = new DataView(buffer);

  // ICONDIR header (6 bytes)
  view.setUint16(0, 0, true);
  view.setUint16(2, 1, true); // 1 = ICO
  view.setUint16(4, 1, true); // 1 image count

  // ICONDIRENTRY (16 bytes)
  view.setUint8(6, w);
  view.setUint8(7, h);
  view.setUint8(8, 0);
  view.setUint8(9, 0);
  view.setUint16(10, 1, true);
  view.setUint16(12, 32, true);
  view.setUint32(14, pngBytes.length, true);
  view.setUint32(18, 22, true); // offset = 6 + 16 = 22

  const destBytes = new Uint8Array(buffer, 22);
  destBytes.set(pngBytes);

  return new Blob([buffer], { type: 'image/x-icon' });
}

// Helper: base filename without extension
function getBaseName(filename) {
  const idx = filename.lastIndexOf('.');
  return idx !== -1 ? filename.substring(0, idx) : filename;
}

// ==========================================================================
// Rendering Card Elements
// ==========================================================================
function renderItemCard(item) {
  const card = document.createElement('div');
  card.className = `item-card ${state.selectedIds.has(item.id) ? 'is-selected' : ''}`;
  card.id = `card_${item.id}`;

  const origExt = (item.originalName.split('.').pop() || 'IMG').toUpperCase();

  card.innerHTML = `
    <div class="item-card-header">
      <input type="checkbox" class="item-checkbox" data-id="${item.id}" ${state.selectedIds.has(item.id) ? 'checked' : ''}>
      <div class="item-thumb-container" onclick="openCompareModal('${item.id}')" title="Click to inspect &amp; compare original vs converted">
        <img src="${item.originalSrc}" alt="Thumbnail" class="item-thumb-img" id="thumb_${item.id}" />
        <div class="thumb-preview-hover-overlay">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="20" height="20">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        </div>
      </div>
      <div class="item-info">
        <div class="item-title-row">
          <span class="item-name" title="${escapeHtml(item.originalName)}">${escapeHtml(item.originalName)}</span>
          <span class="item-ext-badge">${origExt}</span>
        </div>
        <div class="item-dims" id="dims_${item.id}">Calculating...</div>
      </div>
    </div>

    <div class="item-metrics-bar">
      <div class="metric-sizes" id="metrics_${item.id}">
        <span class="orig-size">${formatBytes(item.originalSize)}</span>
        <span class="size-arrow">&rarr;</span>
        <span class="conv-size">...</span>
      </div>
      <span class="savings-pill converting" id="statusPill_${item.id}">Converting</span>
    </div>

    <div class="item-card-actions">
      <select class="item-format-override-select" id="override_${item.id}" title="Target format for this image">
        <option value="" ${!item.targetFormatOverride ? 'selected' : ''}>Auto (${targetFormatBadge.textContent})</option>
        <option value="image/webp" ${item.targetFormatOverride === 'image/webp' ? 'selected' : ''}>WebP</option>
        <option value="image/png" ${item.targetFormatOverride === 'image/png' ? 'selected' : ''}>PNG</option>
        <option value="image/jpeg" ${item.targetFormatOverride === 'image/jpeg' ? 'selected' : ''}>JPG</option>
        <option value="image/avif" ${item.targetFormatOverride === 'image/avif' ? 'selected' : ''}>AVIF</option>
        <option value="image/bmp" ${item.targetFormatOverride === 'image/bmp' ? 'selected' : ''}>BMP</option>
        <option value="image/x-icon" ${item.targetFormatOverride === 'image/x-icon' ? 'selected' : ''}>ICO</option>
      </select>

      <div class="item-btn-group" id="btnGroup_${item.id}">
        <button class="btn-card-remove" title="Remove image" onclick="removeSingleItem('${item.id}')">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="16" height="16">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  `;

  // Checkbox event
  const chk = card.querySelector('.item-checkbox');
  chk.addEventListener('change', (e) => {
    if (e.target.checked) {
      state.selectedIds.add(item.id);
      card.classList.add('is-selected');
    } else {
      state.selectedIds.delete(item.id);
      card.classList.remove('is-selected');
    }
    updateSelectionUi();
  });

  // Individual override format change
  const overrideSelect = card.querySelector(`#override_${item.id}`);
  overrideSelect.addEventListener('change', (e) => {
    item.targetFormatOverride = e.target.value || null;
    reprocessItem(item.id);
  });

  itemsContainer.prepend(card);
}

// Update card contents on status change
function updateCardElement(item) {
  const card = document.getElementById(`card_${item.id}`);
  if (!card) return;

  const dimsElem = document.getElementById(`dims_${item.id}`);
  const metricsElem = document.getElementById(`metrics_${item.id}`);
  const statusPill = document.getElementById(`statusPill_${item.id}`);
  const btnGroup = document.getElementById(`btnGroup_${item.id}`);

  if (item.originalWidth && item.originalHeight) {
    if (item.convertedWidth && (item.convertedWidth !== item.originalWidth || item.convertedHeight !== item.originalHeight)) {
      dimsElem.textContent = `${item.originalWidth}×${item.originalHeight} → ${item.convertedWidth}×${item.convertedHeight} px`;
    } else {
      dimsElem.textContent = `${item.originalWidth} × ${item.originalHeight} px`;
    }
  }

  if (item.status === 'converting' || item.status === 'pending') {
    statusPill.className = 'savings-pill converting';
    statusPill.textContent = item.status === 'converting' ? 'Converting...' : 'Pending';
    metricsElem.innerHTML = `
      <span class="orig-size">${formatBytes(item.originalSize)}</span>
      <span class="size-arrow">&rarr;</span>
      <span class="conv-size">...</span>
    `;
    btnGroup.innerHTML = `
      <button class="btn-card-remove" title="Remove image" onclick="removeSingleItem('${item.id}')">
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="16" height="16">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    `;
  } else if (item.status === 'done') {
    const diff = item.originalSize - item.convertedSize;
    const pct = Math.round((diff / item.originalSize) * 100);

    let savedPillClass = 'savings-pill positive';
    let savedPillText = `-${pct}% saved`;

    if (pct < 0) {
      savedPillClass = 'savings-pill neutral';
      savedPillText = `+${Math.abs(pct)}%`;
    } else if (pct === 0) {
      savedPillClass = 'savings-pill neutral';
      savedPillText = `0%`;
    }

    statusPill.className = savedPillClass;
    statusPill.textContent = savedPillText;

    metricsElem.innerHTML = `
      <span class="orig-size">${formatBytes(item.originalSize)}</span>
      <span class="size-arrow">&rarr;</span>
      <span class="conv-size">${formatBytes(item.convertedSize)}</span>
    `;

    btnGroup.innerHTML = `
      <a href="${item.convertedUrl}" download="${item.convertedName}" class="btn-card-download" title="Download ${item.convertedName}">
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="14" height="14">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        <span>Download</span>
      </a>
      <button class="btn-card-remove" title="Remove image" onclick="removeSingleItem('${item.id}')">
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="16" height="16">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    `;
  } else if (item.status === 'error') {
    statusPill.className = 'savings-pill error';
    statusPill.textContent = 'Failed';
    btnGroup.innerHTML = `
      <button class="btn-micro" onclick="reprocessItem('${item.id}')">Retry</button>
      <button class="btn-card-remove" title="Remove image" onclick="removeSingleItem('${item.id}')">
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="16" height="16">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    `;
  }
}

// Remove single item
window.removeSingleItem = function(id) {
  const index = state.items.findIndex(i => i.id === id);
  if (index !== -1) {
    const item = state.items[index];
    if (item.originalSrc) URL.revokeObjectURL(item.originalSrc);
    if (item.convertedUrl) URL.revokeObjectURL(item.convertedUrl);

    state.items.splice(index, 1);
    state.selectedIds.delete(id);

    const card = document.getElementById(`card_${id}`);
    if (card) card.remove();

    updateBatchStats();
    updateSelectionUi();

    if (state.items.length === 0) {
      batchToolbar.classList.add('hidden');
    }
  }
};

// Clear All
btnClearAll.addEventListener('click', () => {
  if (state.items.length === 0) return;
  state.items.forEach(item => {
    if (item.originalSrc) URL.revokeObjectURL(item.originalSrc);
    if (item.convertedUrl) URL.revokeObjectURL(item.convertedUrl);
  });

  state.items = [];
  state.selectedIds.clear();
  itemsContainer.innerHTML = '';
  batchToolbar.classList.add('hidden');
  progressContainer.classList.add('hidden');
  updateBatchStats();
  showToast('Cleared all images', 'info');
});

// Update global batch summary stats
function updateBatchStats() {
  totalCountElem.textContent = state.items.length;
  const doneItems = state.items.filter(i => i.status === 'done');
  convertedCountElem.textContent = doneItems.length;

  if (doneItems.length > 0) {
    const totalOrig = doneItems.reduce((acc, c) => acc + c.originalSize, 0);
    const totalConv = doneItems.reduce((acc, c) => acc + c.convertedSize, 0);
    const savedBytes = totalOrig - totalConv;
    const pct = totalOrig > 0 ? Math.round((savedBytes / totalOrig) * 100) : 0;

    savedSizeTextElem.textContent = pct > 0 ? `${pct}%` : `0%`;
    savedBytesTextElem.textContent = savedBytes > 0 ? `${formatBytes(savedBytes)} saved` : `0 KB`;
  } else {
    savedSizeTextElem.textContent = '0%';
    savedBytesTextElem.textContent = '0 KB';
  }
}

// ==========================================================================
// Selection & Filtering
// ==========================================================================
selectAllCheckbox.addEventListener('change', (e) => {
  const isChecked = e.target.checked;
  state.items.forEach(item => {
    if (isChecked) {
      state.selectedIds.add(item.id);
    } else {
      state.selectedIds.delete(item.id);
    }
    const card = document.getElementById(`card_${item.id}`);
    if (card) {
      card.classList.toggle('is-selected', isChecked);
      const chk = card.querySelector('.item-checkbox');
      if (chk) chk.checked = isChecked;
    }
  });
  updateSelectionUi();
});

function updateSelectionUi() {
  selectedCountText.textContent = state.selectedIds.size;
  selectAllCheckbox.checked = state.selectedIds.size === state.items.length && state.items.length > 0;
  selectAllCheckbox.indeterminate = state.selectedIds.size > 0 && state.selectedIds.size < state.items.length;

  btnDownloadSelected.disabled = state.selectedIds.size === 0;
  btnDeleteSelected.disabled = state.selectedIds.size === 0;
}

btnDeleteSelected.addEventListener('click', () => {
  const idsToDelete = Array.from(state.selectedIds);
  if (idsToDelete.length === 0) return;

  idsToDelete.forEach(id => removeSingleItem(id));
  showToast(`Removed ${idsToDelete.length} selected images`, 'info');
});

btnDownloadSelected.addEventListener('click', async () => {
  const selectedReady = state.items.filter(i => state.selectedIds.has(i.id) && i.status === 'done' && i.convertedUrl);
  if (selectedReady.length === 0) {
    showToast('No ready converted images selected.', 'warning');
    return;
  }
  await downloadItemsDirectly(selectedReady);
});

// Search Filter
searchInput.addEventListener('input', () => {
  state.searchQuery = searchInput.value.toLowerCase().trim();
  let visibleCount = 0;

  state.items.forEach(item => {
    const card = document.getElementById(`card_${item.id}`);
    if (!card) return;

    const matches = item.originalName.toLowerCase().includes(state.searchQuery) ||
                    item.convertedName.toLowerCase().includes(state.searchQuery);

    if (matches) {
      card.classList.remove('hidden');
      visibleCount++;
    } else {
      card.classList.add('hidden');
    }
  });

  if (visibleCount === 0 && state.items.length > 0) {
    emptySearchState.classList.remove('hidden');
  } else {
    emptySearchState.classList.add('hidden');
  }
});

// View switch (Grid vs List)
viewBtnGrid.addEventListener('click', () => {
  itemsContainer.className = 'items-view-container grid-mode';
  viewBtnGrid.classList.add('active');
  viewBtnList.classList.remove('active');
});

viewBtnList.addEventListener('click', () => {
  itemsContainer.className = 'items-view-container list-mode';
  viewBtnList.classList.add('active');
  viewBtnGrid.classList.remove('active');
});

// ==========================================================================
// 📁 Direct Save to Existing Computer Folder (File System Access API)
// ==========================================================================
btnSaveToFolder.addEventListener('click', async () => {
  const readyItems = state.items.filter(i => i.status === 'done' && i.convertedBlob);
  if (readyItems.length === 0) {
    showToast('No converted images ready to save yet.', 'warning');
    return;
  }

  // Check support for modern File System Access API
  if ('showDirectoryPicker' in window) {
    try {
      const dirHandle = await window.showDirectoryPicker({
        mode: 'readwrite',
        startIn: 'downloads'
      });

      const originalHtml = btnSaveToFolder.innerHTML;
      btnSaveToFolder.disabled = true;

      const nameCountMap = {};

      for (let i = 0; i < readyItems.length; i++) {
        const item = readyItems[i];
        btnSaveToFolder.innerHTML = `Saving (${i + 1}/${readyItems.length})...`;

        let fileName = resolveDuplicateName(item.convertedName, nameCountMap);

        // Write directly to file on user's hard drive
        const fileHandle = await dirHandle.getFileHandle(fileName, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(item.convertedBlob);
        await writable.close();
      }

      btnSaveToFolder.innerHTML = `✅ Saved ${readyItems.length} Files!`;
      showToast(`Successfully saved ${readyItems.length} images directly to your folder!`, 'success');

      setTimeout(() => {
        btnSaveToFolder.innerHTML = originalHtml;
        btnSaveToFolder.disabled = false;
      }, 2500);

    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Folder Save Error:', err);
        showToast('Error saving to folder: ' + err.message, 'error');
      }
      btnSaveToFolder.disabled = false;
    }
  } else {
    showToast('Your browser does not support direct folder saving. Downloading as ZIP instead.', 'info');
    btnDownloadZip.click();
  }
});

// ==========================================================================
// 📦 Download as ZIP (Folder Archive)
// ==========================================================================
btnDownloadZip.addEventListener('click', async () => {
  if (typeof JSZip === 'undefined') {
    showToast('ZIP library is loading, please try again.', 'warning');
    return;
  }

  const readyItems = state.items.filter(i => i.status === 'done' && i.convertedBlob);
  if (readyItems.length === 0) {
    showToast('No converted images ready to download.', 'warning');
    return;
  }

  const originalHtml = btnDownloadZip.innerHTML;
  btnDownloadZip.innerHTML = `Zipping (${readyItems.length})...`;
  btnDownloadZip.disabled = true;

  try {
    const zip = new JSZip();
    const nameCountMap = {};

    for (const item of readyItems) {
      const fileName = resolveDuplicateName(item.convertedName, nameCountMap);
      const arrayBuffer = await item.convertedBlob.arrayBuffer();
      zip.file(fileName, arrayBuffer, { binary: true });
    }

    const zipBlob = await zip.generateAsync({
      type: 'blob',
      mimeType: 'application/zip',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 }
    });

    const targetExt = FORMAT_CONFIG[targetFormatSelect.value]?.ext || 'images';
    const zipName = `converted_${targetExt}_${Date.now()}.zip`;
    triggerFileDownload(zipBlob, zipName);

    showToast(`Downloaded ZIP archive with ${readyItems.length} images!`, 'success');
  } catch (err) {
    console.error('ZIP creation error:', err);
    showToast('Failed to generate ZIP: ' + err.message, 'error');
  } finally {
    btnDownloadZip.innerHTML = originalHtml;
    btnDownloadZip.disabled = false;
  }
});

// ==========================================================================
// ⬇️ Download All Files Directly (Staggered Downloads)
// ==========================================================================
btnDownloadDirect.addEventListener('click', async () => {
  const readyItems = state.items.filter(i => i.status === 'done' && i.convertedUrl);
  if (readyItems.length === 0) {
    showToast('No converted images available.', 'warning');
    return;
  }

  await downloadItemsDirectly(readyItems);
});

async function downloadItemsDirectly(items) {
  showToast(`Starting download for ${items.length} files...`, 'info');
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const a = document.createElement('a');
    a.href = item.convertedUrl;
    a.download = item.convertedName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    await new Promise(r => setTimeout(r, 220));
  }
}

// Trigger single blob download
function triggerFileDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 2000);
}

// Avoid duplicate filenames in ZIP or Directory
function resolveDuplicateName(fileName, map) {
  if (map[fileName]) {
    const dotIdx = fileName.lastIndexOf('.');
    const base = dotIdx !== -1 ? fileName.substring(0, dotIdx) : fileName;
    const ext = dotIdx !== -1 ? fileName.substring(dotIdx) : '';
    const newName = `${base}_(${map[fileName]})${ext}`;
    map[fileName]++;
    return newName;
  } else {
    map[fileName] = 1;
    return fileName;
  }
}

// ==========================================================================
// Image Lightbox / Compare Modal
// ==========================================================================
window.openCompareModal = function(id) {
  const item = state.items.find(i => i.id === id);
  if (!item) return;

  modalImageName.textContent = item.originalName;
  modalMetaInfo.textContent = item.convertedName ? `Target: ${item.convertedName}` : '';

  modalOrigImg.src = item.originalSrc;
  modalOrigMeta.textContent = `${item.originalWidth || '?'}×${item.originalHeight || '?'} px • ${formatBytes(item.originalSize)}`;

  if (item.status === 'done' && item.convertedUrl) {
    modalConvImg.src = item.convertedUrl;
    modalConvMeta.textContent = `${item.convertedWidth || '?'}×${item.convertedHeight || '?'} px • ${formatBytes(item.convertedSize)}`;

    const diff = item.originalSize - item.convertedSize;
    const pct = Math.round((diff / item.originalSize) * 100);
    modalStatsSavings.textContent = pct > 0 ? `Reduced by ${pct}% (${formatBytes(diff)} saved)` : `Size difference: +${Math.abs(pct)}%`;

    btnModalDownload.href = item.convertedUrl;
    btnModalDownload.download = item.convertedName;
    btnModalDownload.classList.remove('hidden');
  } else {
    modalConvImg.src = item.originalSrc;
    modalConvMeta.textContent = 'Conversion in progress or pending...';
    modalStatsSavings.textContent = '';
    btnModalDownload.classList.add('hidden');
  }

  compareModal.classList.remove('hidden');
};

function closeModal() {
  compareModal.classList.add('hidden');
  modalOrigImg.src = '';
  modalConvImg.src = '';
}

btnCloseModal.addEventListener('click', closeModal);
btnModalClose.addEventListener('click', closeModal);
compareModal.addEventListener('click', (e) => {
  if (e.target === compareModal) closeModal();
});

window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !compareModal.classList.contains('hidden')) {
    closeModal();
  }
});

// ==========================================================================
// Toast Notification Helper
// ==========================================================================
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;

  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px) scale(0.95)';
    toast.style.transition = 'all 0.2s ease';
    setTimeout(() => toast.remove(), 200);
  }, 3200);
}

// Format bytes
function formatBytes(bytes, decimals = 1) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
