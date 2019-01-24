const { globalShortcut, ipcMain, BrowserWindow, Menu } = require('electron');


/* Receiver */
ipcMain.on('IsMagnifierOnFromRenderer', (event, arg) => {
    toggleMagnifier(event.sender, arg);
    toggleMenuItemOfMagnifier();
});
ipcMain.on('CaptureFrameFromRenderer', (event, arg) => {
    captureFrame(event.sender);
});


async function toggleMagnifier(window, displayed) {
    if (displayed === false) await captureFrame(window);
    window.send('ToggleMagnifierFromMain');
}

function registerShortcut() {
    const window = BrowserWindow.getAllWindows()[0];
    globalShortcut.register('Space', () => {
        window.send('IsMagnifierOnFromMain');
    });
}

function unregisterShortcut() {
    globalShortcut.unregisterAll();
}

function captureFrame(window) {
    window.send('CaptureFrameFromMain');
    // return new Promise(resolve => {
    //     window.capturePage(image => {
    //         const base64 = image.toDataURL();
    //         // Answer
    //         window.send('CaptureFrameFromMain', base64);
    //         resolve(true);
    //     });
    // });
}

function toggleMenuItemOfMagnifier() {
    const menu = Menu.getApplicationMenu();
    const menuItem = menu.getMenuItemById('toggle_magnifier'); // `toggle_magnifier` => Toggle Magnifier
    menuItem.checked = !menuItem.checked;
}

module.exports = { registerShortcut, unregisterShortcut, toggleMagnifier };
