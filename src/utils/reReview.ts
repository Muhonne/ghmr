
/**
 * Core logic for the "Smart Re-review" feature.
 * Determines if a file should be considered "viewed" based on its current SHA
 * and the SHA at which it was previously marked as viewed.
 */

export const isFileViewed = (
    savedSha: string | undefined,
    currentSha: string
): boolean => {
    // If we have no record of it being viewed, it's not viewed.
    if (!savedSha) return false;

    // If the component's current SHA matches the SHA we saw it at, it is viewed.
    return savedSha === currentSha;
};

/**
 * Updates the 'viewed' map when a user toggles a file's status.
 * 
 * @param currentMap The current state of viewed files (filename -> sha)
 * @param filename The file being toggled
 * @param currentSha The current SHA of the file
 * @param currentViewedState Whether the file is currently considered viewed
 * @returns A new map with the updated state
 */
export const updateViewedState = (
    currentMap: Record<string, string>,
    filename: string,
    currentSha: string,
    cancelViewed: boolean // If true, we are un-viewing it
): Record<string, string> => {
    const newMap = { ...currentMap };

    if (cancelViewed) {
        delete newMap[filename];
    } else {
        newMap[filename] = currentSha;
    }

    return newMap;
};
