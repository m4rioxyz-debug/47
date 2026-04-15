const { contextBridge } = require('electron');

// Expose secure API or system info if needed
contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
});
