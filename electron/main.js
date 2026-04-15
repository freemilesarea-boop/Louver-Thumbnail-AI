const { app, BrowserWindow, ipcMain, dialog, Menu, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const playlistParser = require('./modules/playlistParser');
const thumbnailCollector = require('./modules/thumbnailCollector');
const moodAnalyzer = require('./modules/moodAnalyzer');
const ctrScorer = require('./modules/ctrScorer');

const isDev = process.env.NODE_ENV === 'development';
let mainWindow;

// ─── Window ──────────────────────────────────────────────────

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1024,
    minHeight: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    title: 'Louver Thumbnail AI',
    backgroundColor: '#FAFBFC',
    show: false,
    ...(process.platform === 'darwin' ? { titleBarStyle: 'hiddenInset' } : {}),
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    if (isDev) mainWindow.webContents.openDevTools();
  });

  mainWindow.on('closed', () => { mainWindow = null; });
}

// ─── Menu ────────────────────────────────────────────────────

function createMenu() {
  const template = [
    {
      label: 'Louver Thumbnail AI',
      submenu: [
        { label: 'Louver Thumbnail AI 정보', role: 'about' },
        { type: 'separator' },
        { label: '종료', accelerator: 'CmdOrCtrl+Q', click: () => app.quit() },
      ],
    },
    {
      label: '편집',
      submenu: [
        { label: '실행 취소', role: 'undo' },
        { label: '다시 실행', role: 'redo' },
        { type: 'separator' },
        { label: '잘라내기', role: 'cut' },
        { label: '복사', role: 'copy' },
        { label: '붙여넣기', role: 'paste' },
        { label: '전체 선택', role: 'selectAll' },
      ],
    },
    {
      label: '보기',
      submenu: [
        { label: '새로고침', role: 'reload' },
        { label: '개발자 도구', role: 'toggleDevTools' },
        { type: 'separator' },
        { label: '확대', role: 'zoomIn' },
        { label: '축소', role: 'zoomOut' },
        { label: '원래 크기', role: 'resetZoom' },
        { type: 'separator' },
        { label: '전체 화면', role: 'togglefullscreen' },
      ],
    },
    {
      label: '도움말',
      submenu: [
        {
          label: 'Pexels API 키 발급',
          click: () => shell.openExternal('https://www.pexels.com/api/new/'),
        },
        {
          label: 'Louver',
          click: () => shell.openExternal('https://louver.kr'),
        },
      ],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// ─── App Lifecycle ───────────────────────────────────────────

app.whenReady().then(() => {
  createMenu();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// ─── IPC: YouTube Playlist ───────────────────────────────────

ipcMain.handle('playlist:parse', async (_e, url) => {
  try {
    const data = await playlistParser.parsePlaylist(url);
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('playlist:collectThumbnails', async (_e, playlistData) => {
  try {
    const data = await thumbnailCollector.collectThumbnails(playlistData);
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// ─── IPC: Analysis ───────────────────────────────────────────

ipcMain.handle('analysis:mood', async (_e, { playlistData, thumbnails }) => {
  try {
    const data = moodAnalyzer.analyzeMood(playlistData, thumbnails);
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('ctr:score', async (_e, config) => {
  try {
    const data = ctrScorer.scoreThumbnail(config);
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// ─── IPC: Pexels API Proxy (메인 프로세스에서 호출 → CORS 없음) ──

ipcMain.handle('pexels:search', async (_e, { query, apiKey, count }) => {
  try {
    const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${count || 6}&orientation=landscape&size=large`;
    const res = await axios.get(url, {
      headers: { Authorization: apiKey },
      timeout: 10000,
    });
    const urls = (res.data.photos || []).map((p) => p.src.landscape);
    return { success: true, data: urls };
  } catch (err) {
    const status = err.response?.status;
    if (status === 401) return { success: false, error: 'Pexels API 키가 유효하지 않습니다.' };
    if (status === 429) return { success: false, error: 'Pexels API 요청 한도 초과.' };
    return { success: false, error: err.message };
  }
});

ipcMain.handle('pexels:testKey', async (_e, apiKey) => {
  try {
    const res = await axios.get('https://api.pexels.com/v1/search?query=test&per_page=1', {
      headers: { Authorization: apiKey },
      timeout: 10000,
    });
    return { success: true, valid: res.status === 200 };
  } catch (err) {
    const status = err.response?.status;
    if (status === 401) return { success: true, valid: false, error: 'API 키가 유효하지 않습니다.' };
    return { success: false, error: err.message };
  }
});

// ─── IPC: File Operations ────────────────────────────────────

ipcMain.handle('thumbnail:save', async (_e, { dataUrl, filename }) => {
  try {
    const { filePath } = await dialog.showSaveDialog(mainWindow, {
      defaultPath: filename || 'thumbnail.png',
      filters: [
        { name: 'PNG Image', extensions: ['png'] },
        { name: 'JPEG Image', extensions: ['jpg', 'jpeg'] },
      ],
    });
    if (!filePath) return { success: false, error: 'cancelled' };

    const base64 = dataUrl.replace(/^data:image\/\w+;base64,/, '');
    fs.writeFileSync(filePath, Buffer.from(base64, 'base64'));
    return { success: true, filePath };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('thumbnail:saveAll', async (_e, thumbnails) => {
  try {
    const { filePaths } = await dialog.showOpenDialog(mainWindow, {
      title: '썸네일 저장할 폴더 선택',
      properties: ['openDirectory', 'createDirectory'],
    });
    if (!filePaths || filePaths.length === 0) return { success: false, error: 'cancelled' };

    const dir = filePaths[0];
    const saved = [];
    for (let i = 0; i < thumbnails.length; i++) {
      const { dataUrl, id } = thumbnails[i];
      const ext = dataUrl.startsWith('data:image/jpeg') ? 'jpg' : 'png';
      const filename = `louver-thumbnail-${String(i + 1).padStart(2, '0')}-${id.slice(-4)}.${ext}`;
      const filePath = path.join(dir, filename);
      const base64 = dataUrl.replace(/^data:image\/\w+;base64,/, '');
      fs.writeFileSync(filePath, Buffer.from(base64, 'base64'));
      saved.push(filePath);
    }

    // 저장 폴더 열기
    shell.openPath(dir);
    return { success: true, dir, saved };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// ─── IPC: App Info ───────────────────────────────────────────

ipcMain.handle('app:getInfo', () => ({
  version: app.getVersion(),
  name: app.getName(),
  platform: process.platform,
  electron: process.versions.electron,
  node: process.versions.node,
}));

// ─── IPC: Image Fetch Proxy (메인 프로세스에서 이미지 다운로드) ──

ipcMain.handle('image:fetch', async (_e, url) => {
  try {
    const res = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 10000,
    });
    const base64 = Buffer.from(res.data).toString('base64');
    const mime = res.headers['content-type'] || 'image/jpeg';
    return { success: true, dataUrl: `data:${mime};base64,${base64}` };
  } catch (err) {
    return { success: false, error: err.message };
  }
});
