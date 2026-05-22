const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Window controls — minimize, maximize, close
  windowControls: (action) => ipcRenderer.send('window-controls', action),

  // Native notification (tray alert for new order events)
  showNotification: ({ title, body }) => ipcRenderer.send('show-notification', { title, body }),

  // Badge count (unread orders + messages combined)
  setBadgeCount: (count) => ipcRenderer.send('badge-count', count),

  // Platform detection for Mac vs Win traffic-light positioning
  platform: process.platform,
});
