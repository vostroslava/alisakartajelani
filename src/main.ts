/**
 * Dual-Universe Vision Board
 * Main entry point - initializes all modules
 */

import './style.css';
import { BackgroundRenderer } from './background';
import { initCells, clearAllCells, getFilledCount } from './cell';
import type { Cell } from './cell';
import { initCropModal, openCropModal } from './crop-modal';
import { initProgress, updateProgress } from './progress';
import { initStorage, exportBoard, importBoard, clearAllImages, clearBoardState } from './storage';
import { exportPNG } from './export';
import { TOTAL_CELLS } from './grid';

// Global state
let backgroundRenderer: BackgroundRenderer | null = null;

/**
 * Initialize application
 */
async function init(): Promise<void> {
  // Initialize storage first
  await initStorage();

  // Initialize WebGL background
  const bgCanvas = document.getElementById('bg-canvas') as HTMLCanvasElement;
  if (bgCanvas) {
    backgroundRenderer = new BackgroundRenderer(bgCanvas);
  }

  // Initialize grid cells
  const grid = document.getElementById('grid');
  if (grid) {
    initCells(
      grid,
      handleProgressChange,
      handleCellEdit
    );

    // Verify 30 cells
    const cellCount = grid.querySelectorAll('.cell').length;
    console.assert(
      cellCount === TOTAL_CELLS,
      `Grid must have exactly ${TOTAL_CELLS} cells, found ${cellCount}`
    );
    console.log(`Vision Board initialized with ${cellCount} cells`);
  }

  // Initialize crop modal
  initCropModal();

  // Initialize progress indicator
  initProgress();
  updateProgress(getFilledCount());

  // Initialize toolbar
  initToolbar();

  // Initialize settings panel
  initSettings();

  // Show settings panel (not hidden by default)
  const settingsPanel = document.getElementById('settings-panel');
  if (settingsPanel) {
    settingsPanel.classList.remove('hidden');
  }
}

/**
 * Handle progress change
 */
function handleProgressChange(filled: number): void {
  updateProgress(filled);

  // Update background animations based on progress
  if (backgroundRenderer) {
    backgroundRenderer.setProgress(filled);
  }
}

/**
 * Handle cell edit request
 */
function handleCellEdit(cell: Cell): void {
  openCropModal(cell);
}

/**
 * Initialize toolbar buttons
 */
function initToolbar(): void {
  const toolbar = document.getElementById('toolbar');
  if (!toolbar) return;

  toolbar.innerHTML = `
    <button class="toolbar-btn" id="btn-add" title="Добавить изображение">➕</button>
    <button class="toolbar-btn" id="btn-clear" title="Очистить всё">🗑️</button>
    <button class="toolbar-btn" id="btn-png" title="Скачать PNG">📷</button>
    <button class="toolbar-btn" id="btn-png-hq" title="Скачать PNG (высокое качество)">🖼️</button>
  `;

  // Add image to first empty cell
  toolbar.querySelector('#btn-add')?.addEventListener('click', () => {
    const emptyCells = document.querySelectorAll('.cell.empty');
    if (emptyCells.length > 0) {
      (emptyCells[0] as HTMLElement).click();
    }
  });

  // Clear all
  toolbar.querySelector('#btn-clear')?.addEventListener('click', async () => {
    if (confirm('Очистить все ячейки?')) {
      await clearAllCells();
    }
  });

  // Export PNG normal
  toolbar.querySelector('#btn-png')?.addEventListener('click', () => {
    exportPNG('normal');
  });

  // Export PNG high quality
  toolbar.querySelector('#btn-png-hq')?.addEventListener('click', () => {
    exportPNG('print');
  });
}

/**
 * Initialize settings panel
 */
function initSettings(): void {
  const themeBtn = document.getElementById('theme-toggle');
  const exportPngBtn = document.getElementById('export-png');
  const exportJsonBtn = document.getElementById('export-json');
  const importJsonBtn = document.getElementById('import-json');
  const clearAllBtn = document.getElementById('clear-all');
  const jsonInput = document.getElementById('json-input') as HTMLInputElement;

  // Theme toggle
  let themeIndex = 0;
  const themes = ['neutral', 'warm', 'cool'];

  themeBtn?.addEventListener('click', () => {
    themeIndex = (themeIndex + 1) % themes.length;
    const theme = themes[themeIndex];

    if (theme === 'neutral') {
      delete document.documentElement.dataset.theme;
    } else {
      document.documentElement.dataset.theme = theme;
    }

    // Update background warmth
    if (backgroundRenderer) {
      const warmth = theme === 'warm' ? 0.15 : theme === 'cool' ? -0.1 : 0;
      backgroundRenderer.setWarmth(warmth);
    }
  });

  // Export PNG
  exportPngBtn?.addEventListener('click', () => {
    exportPNG('normal');
  });

  // Export JSON
  exportJsonBtn?.addEventListener('click', async () => {
    const json = await exportBoard();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `vision-board-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });

  // Import JSON
  importJsonBtn?.addEventListener('click', () => {
    jsonInput?.click();
  });

  jsonInput?.addEventListener('change', async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      await importBoard(text);

      // Reload cells
      const grid = document.getElementById('grid');
      if (grid) {
        initCells(grid, handleProgressChange, handleCellEdit);
      }
    } catch (err) {
      console.error('Import error:', err);
      alert('Ошибка импорта файла');
    }

    // Reset input
    jsonInput.value = '';
  });

  // Clear all
  clearAllBtn?.addEventListener('click', async () => {
    if (confirm('Удалить все изображения и сбросить прогресс?')) {
      await clearAllImages();
      clearBoardState();

      // Reload cells
      const grid = document.getElementById('grid');
      if (grid) {
        initCells(grid, handleProgressChange, handleCellEdit);
      }
      updateProgress(0);

      if (backgroundRenderer) {
        backgroundRenderer.setProgress(0);
      }
    }
  });
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
