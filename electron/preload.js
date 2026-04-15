const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('louverAPI', {
  // Playlist operations
  parsePlaylist: (url) => ipcRenderer.invoke('playlist:parse', url),
  collectThumbnails: (playlistData) => ipcRenderer.invoke('playlist:collectThumbnails', playlistData),

  // Analysis
  analyzeMood: (data) => ipcRenderer.invoke('analysis:mood', data),

  // CTR scoring
  scoreThumbnail: (config) => ipcRenderer.invoke('ctr:score', config),

  // File operations
  saveThumbnail: (data) => ipcRenderer.invoke('thumbnail:save', data),
});
