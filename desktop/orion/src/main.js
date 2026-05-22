const { app, BrowserWindow, ipcMain, Tray, nativeImage, Notification } = require('electron');
const path = require('node:path');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

let mainWindow;
let tray;

const createWindow = () => {
  // Create the browser window — frameless for custom chrome
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    frame: false,
    titleBarStyle: 'hidden', // macOS: hides default titlebar but keeps traffic lights
    trafficLightPosition: { x: 12, y: 12 }, // macOS traffic light positioning
    autoHideMenuBar: true,
    backgroundColor: '#0f172a',
    webPreferences: {
      preload: path.join(__dirname, '../../src/preload.js'),
      webSecurity: false,
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Remove the menu bar completely
  mainWindow.setMenu(null);

  // and load the index.html of the app.
  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

  // Intercept and modify CSP headers to allow API connections
  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self' 'unsafe-inline' data:; " +
          "img-src 'self' data: https:; " +
          "media-src 'self' https:; " +
          "font-src 'self' https://fonts.gstatic.com https://fonts.googleapis.com; " +
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
          "connect-src 'self' http://127.0.0.1:3001 http://localhost:3001 ws://127.0.0.1:3001 ws://localhost:3001 https://*.onrender.com wss://*.onrender.com https://api.giphy.com; " +
          "script-src 'self' 'unsafe-inline' 'unsafe-eval';"
        ]
      }
    });
  });

  // Open the DevTools.
  // mainWindow.webContents.openDevTools();

  // Handle DevTools toggle manually since menu bar is hidden
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.control && input.shift && input.key.toLowerCase() === 'i') {
      mainWindow.webContents.toggleDevTools();
      event.preventDefault();
    } else if (input.key === 'F12') {
      mainWindow.webContents.toggleDevTools();
      event.preventDefault();
    }
  });
};

// ─── IPC Handlers ──────────────────────────────────────────────

// Window controls: minimize, maximize, close
ipcMain.on('window-controls', (event, action) => {
  if (!mainWindow) return;
  switch (action) {
    case 'minimize':
      mainWindow.minimize();
      break;
    case 'maximize':
      if (mainWindow.isMaximized()) {
        mainWindow.unmaximize();
      } else {
        mainWindow.maximize();
      }
      break;
    case 'close':
      mainWindow.close();
      break;
  }
});

// Show native notification (tray alert for new order events)
ipcMain.on('show-notification', (event, { title, body }) => {
  if (Notification.isSupported()) {
    new Notification({ title, body }).show();
  }
});

// Badge count (unread orders + messages combined)
ipcMain.on('badge-count', (event, count) => {
  if (process.platform === 'darwin') {
    app.dock.setBadge(count > 0 ? String(count) : '');
  }
  // Windows: flash taskbar if count > 0
  if (process.platform === 'win32' && mainWindow) {
    mainWindow.flashFrame(count > 0);
  }
});

// ─── App Lifecycle ─────────────────────────────────────────────

app.whenReady().then(() => {
  createWindow();

  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
