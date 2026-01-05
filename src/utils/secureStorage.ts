import { Store } from '@tauri-apps/plugin-store';

export interface DiffColors {
    addedBackground: string;
    addedGutterBackground: string;
    removedBackground: string;
    removedGutterBackground: string;
    wordAddedBackground: string;
    wordRemovedBackground: string;
}

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
    getDiffColors(): Promise<DiffColors>;
    setDiffColors(colors: DiffColors): Promise<void>;
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

    async getDiffColors(): Promise<DiffColors> {
        const store = await this.getStore();
        const colors = await store.get<DiffColors>('diff_colors');
        return colors || {
            addedBackground: '#0e1c14',
            addedGutterBackground: '#0f1e16',
            removedBackground: '#1c1215',
            removedGutterBackground: '#1d1316',
            wordAddedBackground: '#11231a',
            wordRemovedBackground: '#22151a',
        };
    }

    async setDiffColors(colors: DiffColors): Promise<void> {
        const store = await this.getStore();
        await store.set('diff_colors', colors);
        await store.save();
    }
}

// Export singleton instance
export const secureStorage: SecureStorage = new TauriSecureStorage();
