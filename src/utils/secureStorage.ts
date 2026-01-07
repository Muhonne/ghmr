import { Store } from '@tauri-apps/plugin-store';



export interface SecureStorage {
    getToken(): Promise<string | null>;
    setToken(token: string): Promise<void>;
    removeToken(): Promise<void>;
    getFontSize(): Promise<number>;
    setFontSize(size: number): Promise<void>;
    getFileListWidth(): Promise<number>;
    setFileListWidth(width: number): Promise<void>;
    getViewedFiles(mrId: number): Promise<Record<string, string>>;
    setViewedFiles(mrId: number, files: Record<string, string>): Promise<void>;
    getPollInterval(): Promise<number>;
    setPollInterval(ms: number): Promise<void>;

}

class TauriSecureStorage implements SecureStorage {
    private store: Store | null = null;

    private async getStore(): Promise<Store> {
        if (!this.store) {
            this.store = await Store.load('secure-settings.bin');
        }
        return this.store;
    }

    async getToken(): Promise<string | null> {
        const store = await this.getStore();
        return (await store.get<string>('gh_token')) ?? null;
    }

    async setToken(token: string): Promise<void> {
        const store = await this.getStore();
        await store.set('gh_token', token);
        await store.save();
    }

    async removeToken(): Promise<void> {
        const store = await this.getStore();
        await store.delete('gh_token');
        await store.save();
    }

    async getFontSize(): Promise<number> {
        const store = await this.getStore();
        const size = await store.get<number>('app_font_size');
        return size || 14;
    }

    async setFontSize(size: number): Promise<void> {
        const store = await this.getStore();
        await store.set('app_font_size', size);
        await store.save();
    }

    async getFileListWidth(): Promise<number> {
        const store = await this.getStore();
        const width = await store.get<number>('file_list_width');
        return width || 300;
    }

    async setFileListWidth(width: number): Promise<void> {
        const store = await this.getStore();
        await store.set('file_list_width', width);
        await store.save();
    }

    async getViewedFiles(mrId: number): Promise<Record<string, string>> {
        const store = await this.getStore();
        const viewed = await store.get<Record<string, string>>(`viewed_${mrId}`);
        return viewed || {};
    }

    async setViewedFiles(mrId: number, files: Record<string, string>): Promise<void> {
        const store = await this.getStore();
        await store.set(`viewed_${mrId}`, files);
        await store.save();
    }

    async getPollInterval(): Promise<number> {
        const store = await this.getStore();
        const interval = await store.get<number>('poll_interval');
        return interval || 5000;
    }

    async setPollInterval(ms: number): Promise<void> {
        const store = await this.getStore();
        await store.set('poll_interval', ms);
        await store.save();
    }


}

class WebSecureStorage implements SecureStorage {
    async getToken(): Promise<string | null> {
        return localStorage.getItem('gh_token');
    }

    async setToken(token: string): Promise<void> {
        localStorage.setItem('gh_token', token);
    }

    async removeToken(): Promise<void> {
        localStorage.removeItem('gh_token');
    }

    async getFontSize(): Promise<number> {
        const size = localStorage.getItem('app_font_size');
        return size ? parseInt(size, 10) : 14;
    }

    async setFontSize(size: number): Promise<void> {
        localStorage.setItem('app_font_size', size.toString());
    }

    async getFileListWidth(): Promise<number> {
        const width = localStorage.getItem('file_list_width');
        return width ? parseInt(width, 10) : 300;
    }

    async setFileListWidth(width: number): Promise<void> {
        localStorage.setItem('file_list_width', width.toString());
    }

    async getViewedFiles(mrId: number): Promise<Record<string, string>> {
        const viewed = localStorage.getItem(`viewed_${mrId}`);
        return viewed ? JSON.parse(viewed) : {};
    }

    async setViewedFiles(mrId: number, files: Record<string, string>): Promise<void> {
        localStorage.setItem(`viewed_${mrId}`, JSON.stringify(files));
    }

    async getPollInterval(): Promise<number> {
        const interval = localStorage.getItem('poll_interval');
        return interval ? parseInt(interval, 10) : 5000;
    }

    async setPollInterval(ms: number): Promise<void> {
        localStorage.setItem('poll_interval', ms.toString());
    }
}

// Check for Tauri environment
// @ts-ignore
const isTauri = typeof window !== 'undefined' && !!window.__TAURI_INTERNALS__;

// Export singleton instance
export const secureStorage: SecureStorage = isTauri ? new TauriSecureStorage() : new WebSecureStorage();
