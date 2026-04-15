const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const playlistParser = require('./modules/playlistParser');
const thumbnailCollector = require('./modules/thumbnailCollector');
const moodAnalyzer = require('./modules/moodAnalyzer');
const ctrScorer = require('./modules/ctrScorer');

const isDev = process.env.NODE_ENV === 'development';

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#FAFBFC',
    show: false,
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// --- IPC Handlers ---

// Parse playlist URL and return metadata
ipcMain.handle('playlist:parse', async (_event, url) => {
  try {
    const playlistData = await playlistParser.parsePlaylist(url);
    return { success: true, data: playlistData };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Collect thumbnails from playlist items
ipcMain.handle('playlist:collectThumbnails', async (_event, playlistData) => {
  try {
    const thumbnails = await thumbnailCollector.collectThumbnails(playlistData);
    return { success: true, data: thumbnails };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Analyze mood from playlist data and thumbnails
ipcMain.handle('analysis:mood', async (_event, { playlistData, thumbnails }) => {
  try {
    const moodResult = moodAnalyzer.analyzeMood(playlistData, thumbnails);
    return { success: true, data: moodResult };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Score a thumbnail for CTR
ipcMain.handle('ctr:score', async (_event, thumbnailConfig) => {
  try {
    const score = ctrScorer.scoreThumbnail(thumbnailConfig);
    return { success: true, data: score };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Save generated thumbnail to disk
ipcMain.handle('thumbnail:save', async (_event, { dataUrl, filename }) => {
  try {
    const { filePath } = await dialog.showSaveDialog(mainWindow, {
      defaultPath: filename || 'thumbnail.png',
      filters: [
        { name: 'PNG Image', extensions: ['png'] },
        { name: 'JPEG Image', extensions: ['jpg', 'jpeg'] },
      ],
    });

    if (!filePath) {
      return { success: false, error: 'Save cancelled' };
    }

    const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    fs.writeFileSync(filePath, buffer);

    return { success: true, filePath };
  } catch (error) {
    return { success: false, error: error.message };
  }
});
