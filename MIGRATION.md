# Migration from Electron to Tauri

## Summary

This project has been successfully migrated from Electron to Tauri. Tauri provides a lighter, more secure, and more performant alternative to Electron for building desktop applications.

## What Changed

### Removed
- **Electron dependencies**: `electron`, `electron-builder`, `electron-is-dev`, `concurrently`, `wait-on`
- **Electron files**: `main.electron.cjs`, `preload.electron.cjs`
- **Electron scripts**: `electron:dev`, `electron:build`
- **Electron integration code**: All `window.electron` API calls in the application

### Added
- **Tauri dependencies**: `@tauri-apps/api`, `@tauri-apps/cli`
- **Tauri configuration**: `src-tauri/` directory with Rust backend
- **Tauri scripts**: `tauri:dev`, `tauri:build`

### Modified
- **Storage**: Replaced Electron's file-based config storage with `localStorage` (browser storage)
- **Type definitions**: Removed `window.electron` interface from `src/types/index.ts`
- **App logic**: Simplified `src/App.tsx` to use only `localStorage` for persistence

## Benefits of Tauri

1. **Smaller bundle size**: Tauri apps are significantly smaller than Electron apps
2. **Better performance**: Uses the system's native webview instead of bundling Chromium
3. **Enhanced security**: Rust-based backend with a secure IPC layer
4. **Lower memory footprint**: No need to bundle an entire browser engine

## Development

### Running in Development Mode
```bash
npm run tauri:dev
```

This will:
1. Start the Vite dev server
2. Launch the Tauri app with hot-reload enabled

### Building for Production
```bash
npm run tauri:build
```

This will:
1. Build the frontend with Vite
2. Compile the Rust backend
3. Create a native macOS app bundle at `src-tauri/target/release/bundle/macos/ghmr.app`

## Application Location

After building, you can find the application at:
- **App bundle**: `src-tauri/target/release/bundle/macos/ghmr.app`
- **Executable**: `src-tauri/target/release/app`

You can run the app directly by double-clicking `ghmr.app` or dragging it to your Applications folder.

## Data Storage

Previously, the app used Electron's file system APIs to store configuration and review data. Now it uses browser `localStorage`:
- **GitHub token**: `localStorage.getItem('gh_token')`
- **Font size**: `localStorage.getItem('app_font_size')`
- **File list width**: `localStorage.getItem('file_list_width')`
- **Viewed files**: `localStorage.getItem('viewed_${mrId}')`

The data is stored in the webview's local storage, which persists between app launches.

## Configuration

The Tauri configuration is located at `src-tauri/tauri.conf.json`. Key settings:
- **Bundle identifier**: `com.ghmr.viewer`
- **Window title**: `GHMR Viewer`
- **Dev server**: `http://localhost:5173`
- **Frontend dist**: `../dist`

## Notes

- The DMG creation may fail on some systems, but the `.app` bundle is always created successfully
- All existing functionality remains the same - only the underlying desktop framework changed
- No changes to the UI or user experience
