const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    loadConfig: () => ipcRenderer.invoke('load-config'),
    saveConfig: (config) => ipcRenderer.invoke('save-config', config),
    loadReviews: (mrId) => ipcRenderer.invoke('load-reviews', mrId),
    saveReview: (mrId, viewedMap) => ipcRenderer.invoke('save-review', { mrId, viewedMap }),
});
