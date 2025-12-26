/**
 * Cell management for Dual-Universe Vision Board
 * Handles image upload, display, and interactions for each cell
 */

import { TOTAL_CELLS } from './grid';
import {
    storeImage,
    getImage,
    deleteImage,
    generateId,
    saveBoardState,
    loadBoardState
} from './storage';
import type { CellData, BoardState } from './storage';

export type CellState = 'empty' | 'filled' | 'editing';

export interface Cell {
    element: HTMLElement;
    index: number;
    state: CellState;
    data: CellData | null;
    imageElement: HTMLImageElement | null;
}

let cells: Cell[] = [];
let onProgressChange: ((filled: number) => void) | null = null;
let onCellEdit: ((cell: Cell) => void) | null = null;

/**
 * Initialize all cells in the grid
 */
export function initCells(
    gridElement: HTMLElement,
    progressCallback: (filled: number) => void,
    editCallback: (cell: Cell) => void
): void {
    onProgressChange = progressCallback;
    onCellEdit = editCallback;

    cells = [];
    gridElement.innerHTML = '';

    for (let i = 0; i < TOTAL_CELLS; i++) {
        const cell = createCell(i);
        cells.push(cell);
        gridElement.appendChild(cell.element);
    }

    // Validate we have exactly 30 cells
    console.assert(
        cells.length === TOTAL_CELLS,
        `Expected ${TOTAL_CELLS} cells, got ${cells.length}`
    );

    // Load saved state
    loadSavedCells();
}

/**
 * Create a single cell element
 */
function createCell(index: number): Cell {
    const element = document.createElement('div');
    element.className = 'cell empty';
    element.dataset.index = String(index);

    // Event listeners
    element.addEventListener('click', () => handleCellClick(index));
    element.addEventListener('dragover', (e) => handleDragOver(e, index));
    element.addEventListener('dragleave', () => handleDragLeave(index));
    element.addEventListener('drop', (e) => handleDrop(e, index));

    // Long press for mobile
    let longPressTimer: number;
    element.addEventListener('touchstart', () => {
        longPressTimer = window.setTimeout(() => {
            const cell = cells[index];
            if (cell.state === 'filled' && onCellEdit) {
                onCellEdit(cell);
            }
        }, 500);
    });
    element.addEventListener('touchend', () => clearTimeout(longPressTimer));
    element.addEventListener('touchmove', () => clearTimeout(longPressTimer));

    return {
        element,
        index,
        state: 'empty',
        data: null,
        imageElement: null,
    };
}

/**
 * Handle cell click
 */
function handleCellClick(index: number): void {
    const cell = cells[index];

    if (cell.state === 'empty') {
        // Open file picker with mobile camera support
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        // Allow camera capture on mobile devices - commented to allow gallery access too
        // input.setAttribute('capture', 'environment');

        // Some mobile browsers need the input to be in DOM
        input.style.position = 'absolute';
        input.style.opacity = '0';
        input.style.pointerEvents = 'none';
        document.body.appendChild(input);

        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
                await addImageToCell(index, file);
            }
            // Clean up
            document.body.removeChild(input);
        };

        // Trigger click with slight delay for mobile compatibility
        setTimeout(() => input.click(), 100);
    } else if (cell.state === 'filled' && onCellEdit) {
        onCellEdit(cell);
    }
}

/**
 * Handle drag over
 */
function handleDragOver(e: DragEvent, index: number): void {
    e.preventDefault();
    e.stopPropagation();
    cells[index].element.classList.add('dragover');
}

/**
 * Handle drag leave
 */
function handleDragLeave(index: number): void {
    cells[index].element.classList.remove('dragover');
}

/**
 * Handle drop
 */
async function handleDrop(e: DragEvent, index: number): Promise<void> {
    e.preventDefault();
    e.stopPropagation();

    cells[index].element.classList.remove('dragover');

    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
        const file = files[0];
        if (file.type.startsWith('image/')) {
            await addImageToCell(index, file);
        }
    }
}

/**
 * Add image to a cell
 */
export async function addImageToCell(
    index: number,
    file: File,
    cropSettings?: CellData['cropSettings']
): Promise<void> {
    const cell = cells[index];
    const imageId = generateId();

    // Store image in IndexedDB
    await storeImage(imageId, file);

    // Create image element
    const imgUrl = URL.createObjectURL(file);
    const img = document.createElement('img');
    img.className = 'cell-image';
    img.src = imgUrl;
    img.draggable = false;

    // Add actions overlay
    const actions = createCellActions(index);

    // Update cell
    cell.element.classList.remove('empty');
    cell.element.classList.add('filled', 'animating');
    cell.element.innerHTML = '';
    cell.element.appendChild(img);
    cell.element.appendChild(actions);

    cell.state = 'filled';
    cell.imageElement = img;
    cell.data = {
        index,
        imageId,
        cropSettings: cropSettings || {
            offsetX: 0,
            offsetY: 0,
            scale: 1,
            rotation: 0,
        },
    };

    // Apply crop settings
    applyCropSettings(cell);

    // Remove animation class after animation ends
    setTimeout(() => {
        cell.element.classList.remove('animating');
    }, 500);

    // Save and update progress
    saveState();
    updateProgress();
}

/**
 * Create action buttons for filled cell
 */
function createCellActions(index: number): HTMLElement {
    const actions = document.createElement('div');
    actions.className = 'cell-actions';

    // Edit button
    const editBtn = document.createElement('button');
    editBtn.className = 'cell-action-btn';
    editBtn.innerHTML = '✏️';
    editBtn.title = 'Редактировать';
    editBtn.onclick = (e) => {
        e.stopPropagation();
        const cell = cells[index];
        if (onCellEdit) onCellEdit(cell);
    };

    // Delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'cell-action-btn';
    deleteBtn.innerHTML = '🗑️';
    deleteBtn.title = 'Удалить';
    deleteBtn.onclick = async (e) => {
        e.stopPropagation();
        await removeImageFromCell(index);
    };

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);

    return actions;
}

/**
 * Remove image from cell
 */
export async function removeImageFromCell(index: number): Promise<void> {
    const cell = cells[index];

    if (cell.data) {
        await deleteImage(cell.data.imageId);
    }

    cell.element.className = 'cell empty';
    cell.element.innerHTML = '';
    cell.state = 'empty';
    cell.data = null;
    cell.imageElement = null;

    saveState();
    updateProgress();
}

/**
 * Update cell crop settings
 */
export function updateCellCrop(
    index: number,
    cropSettings: CellData['cropSettings']
): void {
    const cell = cells[index];
    if (cell.data) {
        cell.data.cropSettings = cropSettings;
        applyCropSettings(cell);
        saveState();
    }
}

/**
 * Apply crop settings to cell image
 */
function applyCropSettings(cell: Cell): void {
    if (!cell.imageElement || !cell.data) return;

    const { offsetX, offsetY, scale, rotation } = cell.data.cropSettings;

    cell.imageElement.style.transform = `
    translate(${offsetX}px, ${offsetY}px)
    scale(${scale})
    rotate(${rotation}deg)
  `;
}

/**
 * Get filled cells count
 */
export function getFilledCount(): number {
    return cells.filter(c => c.state === 'filled').length;
}

/**
 * Update progress callback
 */
function updateProgress(): void {
    if (onProgressChange) {
        const filled = getFilledCount();
        onProgressChange(filled);

        // Surprise mode triggers
        const poster = document.getElementById('poster');
        if (poster) {
            poster.classList.remove('surprise-10', 'surprise-30');

            if (filled === 10) {
                poster.classList.add('surprise-10');
                setTimeout(() => poster.classList.remove('surprise-10'), 2000);
            } else if (filled === 30) {
                poster.classList.add('surprise-30');
                setTimeout(() => poster.classList.remove('surprise-30'), 3000);
            }
        }
    }
}

/**
 * Save current state
 */
function saveState(): void {
    const state: BoardState = {
        cells: cells
            .filter(c => c.data !== null)
            .map(c => c.data!),
        theme: (document.documentElement.dataset.theme as BoardState['theme']) || 'neutral',
        lastModified: Date.now(),
    };

    saveBoardState(state);
}

/**
 * Load saved cells from storage
 */
async function loadSavedCells(): Promise<void> {
    const state = loadBoardState();
    if (!state) return;

    for (const cellData of state.cells) {
        const blob = await getImage(cellData.imageId);
        if (blob) {
            const file = new File([blob], 'image', { type: blob.type });
            await addImageToCell(cellData.index, file, cellData.cropSettings);
        }
    }

    // Restore theme
    if (state.theme !== 'neutral') {
        document.documentElement.dataset.theme = state.theme;
    }
}

/**
 * Clear all cells
 */
export async function clearAllCells(): Promise<void> {
    for (let i = 0; i < cells.length; i++) {
        if (cells[i].state === 'filled') {
            await removeImageFromCell(i);
        }
    }
}

/**
 * Get all cells for export
 */
export function getAllCells(): Cell[] {
    return cells;
}
