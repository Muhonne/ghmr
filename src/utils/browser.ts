import { openUrl as tauriOpenUrl } from '@tauri-apps/plugin-opener';

/**
 * Opens a URL in the system default browser.
 * Falls back to window.open if Tauri is not available (e.g. in web preview).
 */
export const openUrl = async (url: string) => {
    try {
        // Tauri v2 opener plugin
        await tauriOpenUrl(url);
    } catch (error) {
        console.error('Failed to open URL with Tauri:', error);
        window.open(url, '_blank');
    }
};
