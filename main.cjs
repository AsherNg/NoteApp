const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

const createWindow = () => {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 600,
    minHeight: 800,
    webPreferences: {
        preload:path.join(__dirname, 'preload.cjs'),
    },
  });
    win.loadURL('http://localhost:5173');
}

const dirToJson = (dirPath) => {
    const stats = fs.statSync(dirPath);
    const info = {
        name: path.basename(dirPath),
        path: dirPath,
        isFolder: stats.isDirectory(),
    }

    if (stats.isDirectory()) {
        info.items = fs.readdirSync(dirPath).map(child => {
            return dirToJson(path.join(dirPath, child));
        });
    }

    return info;
}


ipcMain.handle('read-folder', async (event, dirPath) => {
    return dirToJson(dirPath);
});

ipcMain.handle('init-folder', async (event) => {
    const defaultPath = path.join(os.homedir(), "AgiNote/notes");
    try {
        await fs.mkdir(defaultPath, { recursive: true });
        return defaultPath;
    } catch (error) {
        console.error("Failed to initialise folder: ", error);
        throw error;
    }
});

ipcMain.handle('is-folder', async (event, path) => {
    try {
        const stats = await fs.stat(path);
        return stats.then(stat => stat.isDirectory());
    } catch (error) {
        console.error("Error checking if path is folder: ", error);
        throw error;
    }
});

ipcMain.handle('get-name', async (event, filePath) => {
    try {
        return path.basename(filePath);
    } catch (error) {
        console.error("Error checking if path is folder: ", error);
        throw error;
    }
});

ipcMain.handle('read-file', async (event, filePath) => {
    try {
        const content = await fs.readFile(filePath, { encoding: 'utf-8' });
        return content;
    } catch (error) {
        console.error("Failed to read file: ", error);
        throw error;
    }
});

ipcMain.handle('write-file', async (event, filePath, content) => {
    try {
        await fs.writeFile(filePath, content, { encoding: 'utf-8' });
        return true;
    } catch (error) {
        console.error("Failed to write file: ", error);
        throw error;
    }
});

ipcMain.handle('delete-file', async (event, path) => {
    try {
        await fs.rm(path, { recursive: true, force: true });
    }
    catch (error) {
        console.error("Failed to delete file: ", error);
        throw (error);
    }
});

ipcMain.handle('create-folder', async (event, folderPath) => {
    try {
        await fs.mkdir(folderPath, { recursive: true });
    } catch (error) {
        console.error("Failed to make directory: ", error);
        throw error;
    }
});

ipcMain.handle('create-file', async (event, filePath) => {
    try {
        await fs.writeFile(filePath, '', {encoding: 'utf-8'});
        return true;
    } catch (error) {
        console.error("Failed to make file: ", error);
        throw error;
    }
});

ipcMain.handle('list-files', async (event, folderPath) => {
    try {
        const files = await fs.readdir(folderPath, { withFileTypes: true });
        return files.map((f, idx) => ({
            id: idx,
            name: f.name,
            isDirectory: f.isDirectory(),
            path: path.join(folderPath, f.name)
        }));
    } catch (error) {
        console.error("Failed to list files: ", error);
        throw error;
    }
});

ipcMain.handle('rename', async (event, oldPath, newPath) => {
    try {
        await fs.rename(oldPath, newPath);
        return true;
    } catch (error) {
        console.error("Failed to rename: ", error);
        throw error;
    }
});

app.whenReady().then(() => {
  createWindow();
});