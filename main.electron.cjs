const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const fs = require('fs');

app.name = 'ghmr';

let mainWindow;

// Set Dock Icon on Mac
if (process.platform === 'darwin') {
    const iconPath = path.join(__dirname, 'public/icon.png');
    if (fs.existsSync(iconPath)) {
        app.dock.setIcon(iconPath);
    }
}

// Config storage handling
const userDataPath = app.getPath('userData');
const configPath = path.join(userDataPath, 'config.json');
const reviewsDir = path.join(userDataPath, 'reviews');

// Ensure reviews directory exists
if (!fs.existsSync(reviewsDir)) {
    fs.mkdirSync(reviewsDir, { recursive: true });
}

ipcMain.handle('load-config', () => {
    try {
        if (fs.existsSync(configPath)) {
            return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        }
    } catch (err) {
        console.error('Error reading config:', err);
    }
    return {};
});

ipcMain.handle('save-config', (event, newConfig) => {
    try {
        const config = fs.existsSync(configPath)
            ? JSON.parse(fs.readFileSync(configPath, 'utf-8'))
            : {};
        const updatedConfig = { ...config, ...newConfig };
        fs.writeFileSync(configPath, JSON.stringify(updatedConfig));
        return true;
    } catch (err) {
        console.error('Error saving config:', err);
        return false;
    }
});

// Dedicated Review Storage
ipcMain.handle('load-reviews', (event, mrId) => {
    try {
        const filePath = path.join(reviewsDir, `${mrId}.json`);
        if (fs.existsSync(filePath)) {
            return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        }
    } catch (err) {
        console.error(`Error loading reviews for ${mrId}:`, err);
    }
    return {};
});

ipcMain.handle('save-review', (event, { mrId, viewedMap }) => {
    try {
        const filePath = path.join(reviewsDir, `${mrId}.json`);
        fs.writeFileSync(filePath, JSON.stringify(viewedMap));
        return true;
    } catch (err) {
        console.error(`Error saving reviews for ${mrId}:`, err);
        return false;
    }
});

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.electron.cjs'),
            contextIsolation: true,
            nodeIntegration: false,
        },
        title: 'ghmr',
        icon: path.join(__dirname, 'public/icon.png'),
        titleBarStyle: 'hiddenInset', // Makes it look premium on Mac
        trafficLightPosition: { x: 24, y: 18 }, // Perfectly centered in the 100px sidebar
        backgroundColor: '#0f1115',
    });

    const url = isDev
        ? 'http://127.0.0.1:5173'
        : `file://${path.join(__dirname, 'dist/index.html')}`;

    mainWindow.loadURL(url);

    if (isDev) {
        mainWindow.webContents.openDevTools();
    }

    mainWindow.on('closed', () => (mainWindow = null));
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});


