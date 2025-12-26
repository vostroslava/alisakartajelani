/**
 * Crop modal for Dual-Universe Vision Board
 * Pan, zoom, rotate controls for image editing within cells
 */

import type { Cell } from './cell';
import { updateCellCrop } from './cell';
import type { CellData } from './storage';

let modal: HTMLElement | null = null;
let canvas: HTMLCanvasElement | null = null;
let ctx: CanvasRenderingContext2D | null = null;
let zoomSlider: HTMLInputElement | null = null;
let rotateSlider: HTMLInputElement | null = null;
let applyBtn: HTMLButtonElement | null = null;
let cancelBtn: HTMLButtonElement | null = null;
let backdrop: HTMLElement | null = null;

let currentCell: Cell | null = null;
let currentImage: HTMLImageElement | null = null;
let cropSettings: CellData['cropSettings'] = {
    offsetX: 0,
    offsetY: 0,
    scale: 1,
    rotation: 0,
};

// Pan state
let isPanning = false;
let panStartX = 0;
let panStartY = 0;
let lastOffsetX = 0;
let lastOffsetY = 0;

// Touch state for pinch-zoom
let initialPinchDistance = 0;
let initialScale = 1;

/**
 * Initialize crop modal
 */
export function initCropModal(): void {
    modal = document.getElementById('crop-modal');
    canvas = document.getElementById('crop-canvas') as HTMLCanvasElement;
    ctx = canvas?.getContext('2d') || null;
    zoomSlider = document.getElementById('zoom-slider') as HTMLInputElement;
    rotateSlider = document.getElementById('rotate-slider') as HTMLInputElement;
    applyBtn = document.getElementById('crop-apply') as HTMLButtonElement;
    cancelBtn = document.getElementById('crop-cancel') as HTMLButtonElement;
    backdrop = modal?.querySelector('.modal-backdrop') as HTMLElement;

    if (!modal || !canvas || !ctx) return;

    // Set canvas size
    canvas.width = 400;
    canvas.height = 400;

    // Event listeners
    zoomSlider?.addEventListener('input', handleZoomChange);
    rotateSlider?.addEventListener('input', handleRotateChange);
    applyBtn?.addEventListener('click', handleApply);
    cancelBtn?.addEventListener('click', handleCancel);
    backdrop?.addEventListener('click', handleCancel);

    // Pan events
    canvas.addEventListener('mousedown', handlePanStart);
    canvas.addEventListener('mousemove', handlePanMove);
    canvas.addEventListener('mouseup', handlePanEnd);
    canvas.addEventListener('mouseleave', handlePanEnd);

    // Touch events
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd);

    // Wheel zoom
    canvas.addEventListener('wheel', handleWheel, { passive: false });
}

/**
 * Open crop modal for a cell
 */
export function openCropModal(cell: Cell): void {
    if (!modal || !cell.imageElement || !cell.data) return;

    currentCell = cell;

    // Clone crop settings
    cropSettings = { ...cell.data.cropSettings };

    // Load image
    currentImage = new Image();
    currentImage.crossOrigin = 'anonymous';
    currentImage.onload = () => {
        renderPreview();
        modal!.classList.remove('hidden');

        // Update sliders
        if (zoomSlider) zoomSlider.value = String(cropSettings.scale);
        if (rotateSlider) rotateSlider.value = String(cropSettings.rotation);
    };
    currentImage.src = cell.imageElement.src;
}

/**
 * Close crop modal
 */
function closeCropModal(): void {
    if (modal) modal.classList.add('hidden');
    currentCell = null;
    currentImage = null;
}

/**
 * Render preview on canvas
 */
function renderPreview(): void {
    if (!ctx || !canvas || !currentImage) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw image with transformations
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((cropSettings.rotation * Math.PI) / 180);
    ctx.scale(cropSettings.scale, cropSettings.scale);
    ctx.translate(cropSettings.offsetX, cropSettings.offsetY);

    // Calculate centered position
    const aspectRatio = currentImage.width / currentImage.height;
    let drawWidth = canvas.width;
    let drawHeight = canvas.height;

    if (aspectRatio > 1) {
        drawHeight = drawWidth / aspectRatio;
    } else {
        drawWidth = drawHeight * aspectRatio;
    }

    ctx.drawImage(
        currentImage,
        -drawWidth / 2,
        -drawHeight / 2,
        drawWidth,
        drawHeight
    );

    ctx.restore();

    // Draw crop frame overlay
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

    // Grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;

    const thirdW = canvas.width / 3;
    const thirdH = canvas.height / 3;

    ctx.beginPath();
    ctx.moveTo(thirdW, 0);
    ctx.lineTo(thirdW, canvas.height);
    ctx.moveTo(thirdW * 2, 0);
    ctx.lineTo(thirdW * 2, canvas.height);
    ctx.moveTo(0, thirdH);
    ctx.lineTo(canvas.width, thirdH);
    ctx.moveTo(0, thirdH * 2);
    ctx.lineTo(canvas.width, thirdH * 2);
    ctx.stroke();
}

/**
 * Handle zoom slider change
 */
function handleZoomChange(): void {
    if (zoomSlider) {
        cropSettings.scale = parseFloat(zoomSlider.value);
        renderPreview();
    }
}

/**
 * Handle rotation slider change
 */
function handleRotateChange(): void {
    if (rotateSlider) {
        cropSettings.rotation = parseInt(rotateSlider.value, 10);
        renderPreview();
    }
}

/**
 * Handle apply button
 */
function handleApply(): void {
    if (currentCell) {
        updateCellCrop(currentCell.index, cropSettings);
    }
    closeCropModal();
}

/**
 * Handle cancel button
 */
function handleCancel(): void {
    closeCropModal();
}

/**
 * Handle pan start
 */
function handlePanStart(e: MouseEvent): void {
    isPanning = true;
    panStartX = e.clientX;
    panStartY = e.clientY;
    lastOffsetX = cropSettings.offsetX;
    lastOffsetY = cropSettings.offsetY;
}

/**
 * Handle pan move
 */
function handlePanMove(e: MouseEvent): void {
    if (!isPanning) return;

    const dx = e.clientX - panStartX;
    const dy = e.clientY - panStartY;

    cropSettings.offsetX = lastOffsetX + dx / cropSettings.scale;
    cropSettings.offsetY = lastOffsetY + dy / cropSettings.scale;

    renderPreview();
}

/**
 * Handle pan end
 */
function handlePanEnd(): void {
    isPanning = false;
}

/**
 * Handle touch start (for pinch-zoom)
 */
function handleTouchStart(e: TouchEvent): void {
    e.preventDefault();

    if (e.touches.length === 1) {
        // Single touch - pan
        isPanning = true;
        panStartX = e.touches[0].clientX;
        panStartY = e.touches[0].clientY;
        lastOffsetX = cropSettings.offsetX;
        lastOffsetY = cropSettings.offsetY;
    } else if (e.touches.length === 2) {
        // Double touch - pinch zoom
        isPanning = false;
        initialPinchDistance = getPinchDistance(e.touches);
        initialScale = cropSettings.scale;
    }
}

/**
 * Handle touch move
 */
function handleTouchMove(e: TouchEvent): void {
    e.preventDefault();

    if (e.touches.length === 1 && isPanning) {
        const dx = e.touches[0].clientX - panStartX;
        const dy = e.touches[0].clientY - panStartY;

        cropSettings.offsetX = lastOffsetX + dx / cropSettings.scale;
        cropSettings.offsetY = lastOffsetY + dy / cropSettings.scale;

        renderPreview();
    } else if (e.touches.length === 2) {
        const currentDistance = getPinchDistance(e.touches);
        const scaleChange = currentDistance / initialPinchDistance;

        cropSettings.scale = Math.max(0.5, Math.min(3, initialScale * scaleChange));

        if (zoomSlider) {
            zoomSlider.value = String(cropSettings.scale);
        }

        renderPreview();
    }
}

/**
 * Handle touch end
 */
function handleTouchEnd(): void {
    isPanning = false;
}

/**
 * Get distance between two touch points
 */
function getPinchDistance(touches: TouchList): number {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Handle mouse wheel zoom
 */
function handleWheel(e: WheelEvent): void {
    e.preventDefault();

    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    cropSettings.scale = Math.max(0.5, Math.min(3, cropSettings.scale + delta));

    if (zoomSlider) {
        zoomSlider.value = String(cropSettings.scale);
    }

    renderPreview();
}
