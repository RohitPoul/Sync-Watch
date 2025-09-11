const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Server management
  startHostMode: (options) => ipcRenderer.invoke('start-host-mode', options),
  startClientMode: (connectionInfo) => ipcRenderer.invoke('start-client-mode', connectionInfo),
  stopServer: () => ipcRenderer.invoke('stop-server'),
  getAppState: () => ipcRenderer.invoke('get-app-state'),
  
  // File selection
  selectVideoFile: () => ipcRenderer.invoke('select-video-file'),
  
  // Window controls
  windowMaximize: () => ipcRenderer.invoke('window-maximize'),
  windowClose: () => ipcRenderer.invoke('window-close'),
  windowIsMaximized: () => ipcRenderer.invoke('window-is-maximized'),
  
  // Event listeners
  onAutoJoinRoom: (callback) => {
    ipcRenderer.on('auto-join-room', (event, data) => callback(data));
  },
  
  // Remove listeners
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  },
  
  // Check if running in Electron
  isElectron: true,
  
  // Platform info
  platform: process.platform,
});
