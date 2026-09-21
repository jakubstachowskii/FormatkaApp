const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('formatka', {
  listProjects: () => ipcRenderer.invoke('db:listProjects'),
  getProject: (id) => ipcRenderer.invoke('db:getProject', id),
  saveProject: (payload) => ipcRenderer.invoke('db:saveProject', payload),
  deleteProject: (id) => ipcRenderer.invoke('db:deleteProject', id),
  listCatalog: () => ipcRenderer.invoke('db:listCatalog'),
  upsertCatalog: (row) => ipcRenderer.invoke('db:upsertCatalog', row),
  getSettings: () => ipcRenderer.invoke('db:getSettings'),
  setSetting: (key, value) => ipcRenderer.invoke('db:setSetting', key, value),
  addCutHistory: (payload) => ipcRenderer.invoke('db:addCutHistory', payload),
  listCutHistory: (projectId) => ipcRenderer.invoke('db:listCutHistory', projectId),
  savePdfDialog: (defaultName) => ipcRenderer.invoke('app:savePdfDialog', defaultName),
  writeFile: (filePath, base64) => ipcRenderer.invoke('app:writeFile', filePath, base64)
});
