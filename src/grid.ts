/**
 * Grid calculation module for Dual-Universe Vision Board
 * Ensures exactly 30 cells (5×6) with perfect symmetry
 */

export const COLS = 5;
export const ROWS = 6;
export const TOTAL_CELLS = 30;
export const ASPECT_RATIO = 4 / 5;

export interface GridConfig {
    containerWidth: number;
    containerHeight: number;
    cellSize: number;
    gap: number;
    padding: number;
}

export interface CellPosition {
    x: number;
    y: number;
    width: number;
    height: number;
    row: number;
    col: number;
    index: number;
}

/**
 * Calculate grid dimensions based on container size
 * All measurements are in pixels
 */
export function calculateGrid(containerWidth: number): GridConfig {
    const containerHeight = containerWidth / ASPECT_RATIO;
    const padding = containerWidth * 0.04; // 4% margins
    const gap = containerWidth * 0.015;    // 1.5% gaps

    const availableWidth = containerWidth - padding * 2 - gap * (COLS - 1);
    const cellSize = availableWidth / COLS;

    // Validation: ensure we always have exactly 30 cells
    console.assert(
        COLS * ROWS === TOTAL_CELLS,
        `Grid must have exactly ${TOTAL_CELLS} cells, got ${COLS * ROWS}`
    );

    return {
        containerWidth,
        containerHeight,
        cellSize,
        gap,
        padding,
    };
}

/**
 * Get position for a specific cell by index (0-29)
 */
export function getCellPosition(index: number, config: GridConfig): CellPosition {
    if (index < 0 || index >= TOTAL_CELLS) {
        throw new Error(`Cell index must be between 0 and ${TOTAL_CELLS - 1}`);
    }

    const row = Math.floor(index / COLS);
    const col = index % COLS;

    const x = config.padding + col * (config.cellSize + config.gap);
    const y = config.padding + row * (config.cellSize + config.gap);

    return {
        x,
        y,
        width: config.cellSize,
        height: config.cellSize,
        row,
        col,
        index,
    };
}

/**
 * Get all cell positions
 */
export function getAllCellPositions(config: GridConfig): CellPosition[] {
    const positions: CellPosition[] = [];

    for (let i = 0; i < TOTAL_CELLS; i++) {
        positions.push(getCellPosition(i, config));
    }

    return positions;
}

/**
 * Find cell index at given coordinates (returns -1 if not found)
 */
export function getCellAtPoint(
    x: number,
    y: number,
    config: GridConfig
): number {
    for (let i = 0; i < TOTAL_CELLS; i++) {
        const pos = getCellPosition(i, config);
        if (
            x >= pos.x &&
            x <= pos.x + pos.width &&
            y >= pos.y &&
            y <= pos.y + pos.height
        ) {
            return i;
        }
    }
    return -1;
}
