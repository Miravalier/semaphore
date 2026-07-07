const { app, BrowserWindow, desktopCapturer, session, ipcMain } = require('electron/main');
const path = require('node:path');
const fs = require('node:fs');


let selectedDisplayMediaId = "";


async function createWindow()
{
    const browserWindow = new BrowserWindow({
        width: 1200,
        minWidth: 200,
        minHeight: 200,
        height: 800,
        autoHideMenuBar: true,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
        },
    });

    browserWindow.loadFile('build/main.html');
}


app.whenReady().then(() => {
    createWindow();

    session.defaultSession.setDisplayMediaRequestHandler(async (request, callback) => {
        const sources = await desktopCapturer.getSources({types: ["screen", "window"]});
        for (const source of sources) {
            if (source.id == selectedDisplayMediaId) {
                callback({video: source, audio: 'loopback'});
                return;
            }
        }
        callback({});
    });

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });

    ipcMain.handle('selectScreen', async (event, id) => {
        selectedDisplayMediaId = id;
    });

    ipcMain.handle('getScreens', async (event) => {
        const results = [];
        for (const source of await desktopCapturer.getSources({types: ["screen", "window"]})) {
            results.push({
                id: source.id,
                type: source.id.split(":")[0],
                name: source.name,
                thumbnail: source.thumbnail.toDataURL(),
            });
        }
        return results;
    });
});


app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
