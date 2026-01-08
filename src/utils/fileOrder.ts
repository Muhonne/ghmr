import { MRFile } from '../types';

/**
 * Returns the visual order of file indices, matching the sidebar display order.
 * Files are grouped by directory, with root-level files first, then directories
 * sorted alphabetically.
 */
export function getVisualFileOrder(files: MRFile[]): number[] {
    const groups: { [path: string]: number[] } = {};

    files.forEach((file, index) => {
        const parts = file.filename.split('/');
        const dirPath = parts.length > 1 ? parts.slice(0, -1).join('/') : '';

        if (!groups[dirPath]) {
            groups[dirPath] = [];
        }
        groups[dirPath].push(index);
    });

    // Sort directories: root first, then alphabetically
    const sortedKeys = Object.keys(groups).sort((a, b) => {
        if (a === '') return -1;
        if (b === '') return 1;
        return a.localeCompare(b);
    });

    // Flatten into visual order
    const visualOrder: number[] = [];
    for (const key of sortedKeys) {
        visualOrder.push(...groups[key]);
    }

    return visualOrder;
}

/**
 * Given the current file index and visual order, returns the next file index.
 */
export function getNextFileIndex(currentIndex: number, visualOrder: number[]): number {
    const currentVisualPos = visualOrder.indexOf(currentIndex);
    if (currentVisualPos === -1 || currentVisualPos >= visualOrder.length - 1) {
        return currentIndex;
    }
    return visualOrder[currentVisualPos + 1];
}

/**
 * Given the current file index and visual order, returns the previous file index.
 */
export function getPrevFileIndex(currentIndex: number, visualOrder: number[]): number {
    const currentVisualPos = visualOrder.indexOf(currentIndex);
    if (currentVisualPos <= 0) {
        return currentIndex;
    }
    return visualOrder[currentVisualPos - 1];
}
