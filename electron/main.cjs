const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { initDb, api } = require('./db.cjs');

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 960,
    minHeight: 640,
    backgroundColor: '#0F2436',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  const isDev = process.env.ELECTRON_DEV === '1';
  if (isDev) {
    mainWindow.loadURL('http://127.0.0.1:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }
}

app.whenReady().then(() => {
  initDb(app.getPath('userData'));
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle('db:listProjects', () => api.listProjects());
ipcMain.handle('db:getProject', (_e, id) => api.getProject(id));
ipcMain.handle('db:saveProject', (_e, payload) => api.saveProject(payload));
ipcMain.handle('db:deleteProject', (_e, id) => api.deleteProject(id));
ipcMain.handle('db:listCatalog', () => api.listCatalog());
ipcMain.handle('db:upsertCatalog', (_e, row) => api.upsertCatalog(row));
ipcMain.handle('db:getSettings', () => api.getSettings());
ipcMain.handle('db:setSetting', (_e, key, value) => api.setSetting(key, value));
ipcMain.handle('db:addCutHistory', (_e, payload) => api.addCutHistory(payload));
ipcMain.handle('db:listCutHistory', (_e, projectId) => api.listCutHistory(projectId));

ipcMain.handle('app:savePdfDialog', async (_e, defaultName) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    title: 'Zapisz PDF dla stolarni',
    defaultPath: defaultName || 'lista-rozkroju.pdf',
    filters: [{ name: 'PDF', extensions: ['pdf'] }]
  });
  if (result.canceled || !result.filePath) return null;
  return result.filePath;
});

ipcMain.handle('app:writeFile', async (_e, filePath, base64) => {
  fs.writeFileSync(filePath, Buffer.from(base64, 'base64'));
  return true;
});
