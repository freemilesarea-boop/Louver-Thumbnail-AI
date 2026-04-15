const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('louverAPI', {
  // YouTube Playlist
  parsePlaylist: (url) => ipcRenderer.invoke('playlist:parse', url),
  collectThumbnails: (data) => ipcRenderer.invoke('playlist:collectThumbnails', data),

  // Analysis
  analyzeMood: (data) => ipcRenderer.invoke('analysis:mood', data),
  scoreThumbnail: (config) => ipcRenderer.invoke('ctr:score', config),

  // Pexels API (메인 프로세스 프록시 → CORS 없음)
  pexelsSearch: (params) => ipcRenderer.invoke('pexels:search', params),
  pexelsTestKey: (apiKey) => ipcRenderer.invoke('pexels:testKey', apiKey),

  // File Operations (네이티브 다이얼로그)
  saveThumbnail: (data) => ipcRenderer.invoke('thumbnail:save', data),
  saveAllThumbnails: (thumbnails) => ipcRenderer.invoke('thumbnail:saveAll', thumbnails),

  // Image Fetch (메인 프로세스 프록시 → CORS 없음)
  fetchImage: (url) => ipcRenderer.invoke('image:fetch', url),

  // App Info
  getAppInfo: () => ipcRenderer.invoke('app:getInfo'),

  // Platform check
  isElectron: true,
});
