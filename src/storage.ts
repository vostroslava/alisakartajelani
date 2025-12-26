/**
 * Storage module for Dual-Universe Vision Board
 * Handles IndexedDB for images and LocalStorage for metadata
 */

const DB_NAME = 'vision-board-db';
const DB_VERSION = 1;
const STORE_NAME = 'images';
const META_KEY = 'vision-board-meta';

export interface CellData {
    index: number;
    imageId: string;
    cropSettings: {
        offsetX: number;
        offsetY: number;
        scale: number;
        rotation: number;
    };
}

export interface BoardState {
    cells: CellData[];
    theme: 'warm' | 'cool' | 'neutral';
    lastModified: number;
}

let db: IDBDatabase | null = null;

/**
 * Initialize IndexedDB
 */
export async function initStorage(): Promise<void> {
    console.log('[Storage] Initializing IndexedDB...');
    return new Promise((resolve, reject) => {
        if (!window.indexedDB) {
            console.error('[Storage] IndexedDB not supported');
            reject(new Error('IndexedDB not supported'));
            return;
        }

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => {
            console.error('[Storage] DB Open Error:', request.error);
            reject(request.error);
        };

        request.onsuccess = () => {
            console.log('[Storage] DB Opened Successfully');
            db = request.result;
            resolve();
        };

        request.onupgradeneeded = (e) => {
            console.log('[Storage] DB Upgrade Needed');
            const database = (e.target as IDBOpenDBRequest).result;
            if (!database.objectStoreNames.contains(STORE_NAME)) {
                database.createObjectStore(STORE_NAME, { keyPath: 'id' });
            }
        };
    });
}

/**
 * Store an image blob in IndexedDB
 */
export async function storeImage(id: string, blob: Blob): Promise<void> {
    if (!db) await initStorage();

    return new Promise((resolve, reject) => {
        const tx = db!.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);

        store.put({ id, blob, timestamp: Date.now() });

        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

/**
 * Get an image blob from IndexedDB
 */
export async function getImage(id: string): Promise<Blob | null> {
    if (!db) await initStorage();

    return new Promise((resolve, reject) => {
        const tx = db!.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const request = store.get(id);

        request.onsuccess = () => {
            resolve(request.result?.blob || null);
        };
        request.onerror = () => reject(request.error);
    });
}

/**
 * Delete an image from IndexedDB
 */
export async function deleteImage(id: string): Promise<void> {
    if (!db) await initStorage();

    return new Promise((resolve, reject) => {
        const tx = db!.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.delete(id);

        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

/**
 * Clear all images from IndexedDB
 */
export async function clearAllImages(): Promise<void> {
    if (!db) await initStorage();

    return new Promise((resolve, reject) => {
        const tx = db!.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.clear();

        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

/**
 * Save board metadata to LocalStorage
 */
export function saveBoardState(state: BoardState): void {
    localStorage.setItem(META_KEY, JSON.stringify(state));
}

/**
 * Load board metadata from LocalStorage
 */
export function loadBoardState(): BoardState | null {
    const data = localStorage.getItem(META_KEY);
    if (!data) return null;

    try {
        return JSON.parse(data);
    } catch {
        return null;
    }
}

/**
 * Clear board state
 */
export function clearBoardState(): void {
    localStorage.removeItem(META_KEY);
}

/**
 * Export board as JSON (includes base64 images)
 */
export async function exportBoard(): Promise<string> {
    const state = loadBoardState();
    if (!state) return JSON.stringify({ cells: [], theme: 'neutral' });

    const exportData: {
        cells: (CellData & { imageData?: string })[];
        theme: string;
        exportedAt: number;
    } = {
        cells: [],
        theme: state.theme,
        exportedAt: Date.now(),
    };

    for (const cell of state.cells) {
        const blob = await getImage(cell.imageId);
        let imageData: string | undefined;

        if (blob) {
            imageData = await blobToBase64(blob);
        }

        exportData.cells.push({
            ...cell,
            imageData,
        });
    }

    return JSON.stringify(exportData, null, 2);
}

/**
 * Import board from JSON
 */
export async function importBoard(jsonString: string): Promise<BoardState> {
    const data = JSON.parse(jsonString);

    // Clear existing data
    await clearAllImages();

    const newState: BoardState = {
        cells: [],
        theme: data.theme || 'neutral',
        lastModified: Date.now(),
    };

    for (const cell of data.cells || []) {
        if (cell.imageData) {
            const blob = base64ToBlob(cell.imageData);
            await storeImage(cell.imageId, blob);
        }

        newState.cells.push({
            index: cell.index,
            imageId: cell.imageId,
            cropSettings: cell.cropSettings,
        });
    }

    saveBoardState(newState);
    return newState;
}

// Utility functions
function blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

function base64ToBlob(base64: string): Blob {
    const parts = base64.split(',');
    const mime = parts[0].match(/:(.*?);/)?.[1] || 'image/png';
    const bstr = atob(parts[1]);
    const u8arr = new Uint8Array(bstr.length);

    for (let i = 0; i < bstr.length; i++) {
        u8arr[i] = bstr.charCodeAt(i);
    }

    return new Blob([u8arr], { type: mime });
}

/**
 * Generate unique ID
 */
export function generateId(): string {
    return `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
