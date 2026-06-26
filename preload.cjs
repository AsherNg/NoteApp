const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('fileApi', {
    initDefault: () => ipcRenderer.invoke('init-folder'),
    checkExists: (path) => ipcRenderer.invoke('check-exists', path),
    isFolder: (path) => ipcRenderer.invoke('is-folder', path),
    getName: (filePath) => ipcRenderer.invoke('get-name', filePath),
    readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
    writeFile: (filePath, content) => ipcRenderer.invoke('write-file', filePath, content),
    deleteFile: (path) => ipcRenderer.invoke('delete-file', path),
    createFolder: (folderPath) => ipcRenderer.invoke('create-folder', folderPath),
    createFile: (filePath) => ipcRenderer.invoke('create-file', filePath),
    rename: (oldPath, newPath) => ipcRenderer.invoke('rename', oldPath, newPath),
    readFolder: (dirPath) => ipcRenderer.invoke('read-folder', dirPath),
    copy: (src, dest) => ipcRenderer.invoke('copy', src, dest),
    readTheme: (name) => ipcRenderer.invoke('read-theme', name),
    exportPdf: (html, fileName, options) => ipcRenderer.invoke('export-pdf', html, fileName, options)
});
