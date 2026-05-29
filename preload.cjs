const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('fileApi', {
    initDefault: () => ipcRenderer.invoke('init-folder'),
    isFolder: (path) => ipcRenderer.invoke('is-folder', path),
    getName: (filePath) => ipcRenderer.invoke('get-name', filePath),
    readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
    writeFile: (filePath, content) => ipcRenderer.invoke('write-file', filePath, content),
    deleteFile: (path) => ipcRenderer.invoke('delete-file', path),
    createFolder: (folderPath) => ipcRenderer.invoke('create-folder', folderPath),
    createFile: (filePath) => ipcRenderer.invoke('create-file', filePath),
    listFiles: (folderPath) => ipcRenderer.invoke('list-files', folderPath),
    rename: (oldPath, newPath) => ipcRenderer.invoke('rename', oldPath, newPath)
});
