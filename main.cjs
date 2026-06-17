const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('node:fs');
const os = require('os');

const createWindow = () => {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 600,
    minHeight: 800,
    webPreferences: {
        preload: path.join(__dirname, 'preload.cjs'),
        nodeIntegration: false,
        contextIsolation: true,
    },
  });

    // Allow anthropic API calls from renderer
    win.webContents.session.webRequest.onBeforeSendHeaders((details, callback) => {
        callback({ requestHeaders: { ...details.requestHeaders } });
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


ipcMain.handle('read-folder', (event, dirPath) => {
    return dirToJson(dirPath);
});

ipcMain.handle('init-folder', async (event) => {
    const defaultPath = path.join(os.homedir(), "AgiNote/notes");
    try {
        await fs.promises.mkdir(defaultPath, { recursive: true });
        return defaultPath;
    } catch (error) {
        console.error("Failed to initialise folder: ", error);
        throw error;
    }
});

ipcMain.handle('check-exists', async (event, path) => {
    try {
        await fs.promises.access(path);
        return true;
    } catch (err) {
        console.error("No path found or error: ", err);
        return false;
    }
})

ipcMain.handle('is-folder', async (event, path) => {
    try {
        const stats = await fs.promises.stat(path);
        return stats.then(stat => stat.isDirectory());
    } catch (error) {
        console.error("Error checking if path is folder: ", error);
        throw error;
    }
});

ipcMain.handle('get-name', (event, filePath) => {
    try {
        return path.basename(filePath);
    } catch (error) {
        console.error("Error checking if path is folder: ", error);
        throw error;
    }
});

ipcMain.handle('read-file', async (event, filePath) => {
    try {
        const content = await fs.promises.readFile(filePath, { encoding: 'utf-8' });
        return content;
    } catch (error) {
        console.error("Failed to read file: ", error);
        throw error;
    }
});

ipcMain.handle('write-file', async (event, filePath, content) => {
    try {
        await fs.promises.writeFile(filePath, content, { encoding: 'utf-8' });
        return true;
    } catch (error) {
        console.error("Failed to write file: ", error);
        throw error;
    }
});

ipcMain.handle('delete-file', async (event, path) => {
    try {
        await fs.promises.rm(path, { recursive: true, force: true });
    }
    catch (error) {
        console.error("Failed to delete file: ", error);
        throw (error);
    }
});

ipcMain.handle('create-folder', async (event, folderPath) => {
    try {
        await fs.promises.mkdir(folderPath, { recursive: true });
    } catch (error) {
        console.error("Failed to make directory: ", error);
        throw error;
    }
});

ipcMain.handle('create-file', async (event, filePath) => {
    try {
        await fs.promises.writeFile(filePath, '', {encoding: 'utf-8'});
        return true;
    } catch (error) {
        console.error("Failed to make file: ", error);
        throw error;
    }
});

ipcMain.handle('rename', async (event, oldPath, newPath) => {
    try {
        await fs.promises.rename(oldPath, newPath);
        return true;
    } catch (error) {
        console.error("Failed to rename: ", error);
        throw error;
    }
});

ipcMain.handle('copy', async (event, src, dest) => {
    try {
        await fs.promises.cp(src, dest, {recursive: true});
        return true;
    } catch (err) {
        console.error("Failed to copy: ", err);
        throw err;
    }
})

app.whenReady().then(() => {
  createWindow();
});
