const { contextBridge, ipcRenderer } = require('electron');

const isOSX = process.platform === 'darwin';
const isWindows = process.platform === 'win32';
const isLinux = (!isOSX && !isWindows);

contextBridge.exposeInMainWorld('electronApi', {
    isOSX: isOSX,
    isWindows: isWindows,
    isLinux: isLinux,
    selectScreen: (id) => ipcRenderer.invoke('selectScreen', id),
    getScreens: () => ipcRenderer.invoke('getScreens'),
    getTurnServerInfo: () => ipcRenderer.invoke('getTurnServerInfo'),
});
