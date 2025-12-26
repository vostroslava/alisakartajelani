/**
 * Progress indicator for Dual-Universe Vision Board
 * Ring with 30 segments showing filled cells
 */

import { TOTAL_CELLS } from './grid';

let container: HTMLElement | null = null;
let fillPath: SVGCircleElement | null = null;
let countElement: HTMLElement | null = null;

const RADIUS = 24;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * Initialize progress indicator
 */
export function initProgress(): void {
    container = document.getElementById('progress-indicator');
    if (!container) return;

    container.innerHTML = `
    <svg class="progress-ring" width="60" height="60" viewBox="0 0 60 60">
      <circle
        class="progress-ring-bg"
        cx="30"
        cy="30"
        r="${RADIUS}"
      />
      <circle
        class="progress-ring-fill"
        cx="30"
        cy="30"
        r="${RADIUS}"
        stroke-dasharray="${CIRCUMFERENCE}"
        stroke-dashoffset="${CIRCUMFERENCE}"
      />
    </svg>
    <div class="progress-count">0/${TOTAL_CELLS}</div>
  `;

    fillPath = container.querySelector('.progress-ring-fill');
    countElement = container.querySelector('.progress-count');
}

/**
 * Update progress
 */
export function updateProgress(filled: number): void {
    if (!fillPath || !countElement) return;

    // Clamp value
    const count = Math.max(0, Math.min(TOTAL_CELLS, filled));

    // Update ring
    const progress = count / TOTAL_CELLS;
    const offset = CIRCUMFERENCE * (1 - progress);
    fillPath.style.strokeDashoffset = String(offset);

    // Update gradient color based on progress
    if (progress < 0.33) {
        fillPath.style.stroke = 'var(--accent-travel)';
    } else if (progress < 0.66) {
        fillPath.style.stroke = '#c9a87c';
    } else {
        fillPath.style.stroke = 'var(--accent-dev)';
    }

    // Update count text
    countElement.textContent = `${count}/${TOTAL_CELLS}`;
}
