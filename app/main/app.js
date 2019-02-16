const electron = require('electron');
const path = require('path');
const config = require('./config');
const update = require('./update');
const { app, BrowserWindow, Tray, Menu, shell } = electron;
const { registerShortcut, unregisterShortcut, toggleMagnifier } = require('./magnifier');
const { getSource } = require('./request');


const DEBUG = false;


/**
 * Setting application
 */
const appSetting = {
    name: 'Jike Calendar',
    width: 350,
    height: 520,
    icon: path.join(__dirname, '..', 'assets/icon_Template.png'),
    entry: path.join(__dirname, '..', 'render/index.html')
};

let mainWindow;
let mainTray;

global.cacheTime = new Date().getDate();

app.on('ready', () => {
    createMenu();
    createWindow();
    moveWindow();
});
app.on('will-quit', () => {
    unregisterShortcut();
})
app.on('window-all-closed', () => {
    app.quit();
});
app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});

if (config.get('hidedock')) {
    app.dock.hide();
}


function createMenu() {
    const { l10n } = require('./localization');

    const template = [{
        id: 'toggle_magnifier',
        label: l10n('SHOW_MAGNIFIER'),
        type: 'checkbox',
        checked: false,
        accelerator: 'Space',
        click(menu) { toggleMagnifier(mainWindow, !menu.checked); }
    },
    {
        label: l10n('HIDE_DOCK_ICON'),
        type: 'checkbox',
        checked: config.get('hidedock'),
        accelerator: 'Command+H',
        click(menu) { toggleDockIcon(menu.checked); }
    },
    {
        label: l10n('CHECK_FOR_UPDATES'),
        accelerator: 'Command+U',
        click() { update.check(true); }
    },
    {
        type: 'separator'
    },
    {
        label: l10n('WINDOW'),
        submenu: [{
            label: l10n('CLOSE'),
            accelerator: 'Command+W',
            click() { toggleWindow(false); }
        },
        {
            label: l10n('QUIT'),
            accelerator: 'Command+Q',
            click () { app.quit(); }
        }]
    },
    {
        label: l10n('HELP'),
        submenu: [{
            label: l10n('VERSION') + ' ' + app.getVersion(),
            enabled: false
        },
        {
            type: 'separator'
        },
        {
            label: l10n('ABOUT'),
            role: 'about'
        },
        {
            label: l10n('HOMEPAGE'),
            click() { shell.openExternal('https://www.ryannn.com'); }
        },
        {
            label: l10n('GUIDANCE'),
            click() { shell.openExternal('https://github.com/ryanfwy/jike-calendar'); }
        }]
    }];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}

function createWindow() {
    // Tray
    const { l10n } = require('./localization');
    
    const template = [{
        label: l10n('CHECK_FOR_UPDATES'),
        accelerator: 'Command+U',
        click() { update.check(true); }
    },
    {
        label: l10n('QUIT'),
        accelerator: 'Command+Q',
        click () { app.quit(); }
    },
    {
        type: 'separator'
    },
    {
        label: l10n('VERSION') + ' ' + app.getVersion(),
        enabled: false
    },
    {
        label: l10n('ABOUT'),
        role: 'about'
    },
    {
        label: l10n('HOMEPAGE'),
        click() { shell.openExternal('https://www.ryannn.com'); }
    },
    {
        label: l10n('GUIDANCE'),
        click() { shell.openExternal('https://github.com/ryanfwy/jike-calendar'); }
    }];
    const menu = Menu.buildFromTemplate(template);

    mainTray = new Tray(appSetting.icon);
    mainTray.setToolTip(appSetting.name);

    mainTray.on('click', () => {
        if (!mainWindow.isVisible()) {
            checkCacheTime();
            getSource(mainWindow.webContents);
        }
        toggleWindow();
    });
    mainTray.on('right-click', () => {
        mainTray.popUpContextMenu(menu);
    });
    

    // Window
    mainWindow = new BrowserWindow({
        width: appSetting.width,
        height: appSetting.height,
        show: false,
        frame: false,
        resizable: false,
        minimizable: false,
        maximizable: false,
        fullscreenable: false,
        alwaysOnTop: true,
        opacity: 0.0,
        vibrancy: 'medium-light'
    });

    mainWindow.loadFile(appSetting.entry);

    mainWindow.once('ready-to-show', () => {
        renderContents(mainWindow.webContents);
        getSource(mainWindow.webContents);
        toggleWindow();

        setTimeout(() => {
            update.check();
        }, 10000); // 10 seconds later
    });
    mainWindow.on('blur', () => {
        if (!DEBUG) toggleWindow(false);
    });

    if (DEBUG) mainWindow.openDevTools();
}

function renderContents(window) {
    window.send('RenderContentsFromMain', { nickname: config.get('nickname') });
}

function checkCacheTime() {
    const currentTime = new Date().getDate();
    if (currentTime !== global.cacheTime) {
        mainWindow.webContents.send('RenderAllFromMain');
        global.cacheTime = currentTime;
    }
}

function toggleDockIcon(displayed) {
    displayed ? app.dock.hide() : app.dock.show();
    config.set('hidedock', displayed);
}

function toggleWindow(display=null) {
    const show = display === null ? !mainWindow.isVisible() : display;
    show ? registerShortcut() : unregisterShortcut();

    if (show) {
        // Show window
        mainWindow.show();
        setOpacity({
            mode: '+',
            range: [0.0, 1.0],
            handler: null
        });
    } else {
        // Hide window
        setOpacity({
            mode: '-',
            range: [0.0, 1.0],
            handler: () => {
                mainWindow.hide();
            }
        });
    }
}

function setOpacity(obj) {
    const {mode, range, handler} = obj;
    const [min, max] = range;

    let opacity = mainWindow.getOpacity();
    let newOpacity = mode === '+' ? opacity+0.05 : opacity-0.05;
    mainWindow.setOpacity(newOpacity);
    if (newOpacity < max && newOpacity > min) {
        setTimeout(() => {
            setOpacity({mode, range, handler});
        }, 0.1);
    } else {
        mainWindow.setOpacity(mode === '+' ? max : min);
        if (obj.handler) obj.handler();
    }
}
  
function moveWindow() {
    let orientation = 'top-right';
    let x = 0;
    let y = 0;

    const screen = (electron.screen.getDisplayNearestPoint(electron.screen.getCursorScreenPoint())).bounds;
    const trayBounds = mainTray.getBounds();

    // Orientation is either not on top or OS is windows.
    if (process.platform === 'win32') {
        if (trayBounds.y > screen.height / 2) {
            orientation = (trayBounds.x > screen.width / 2) ? 'bottom-right' : 'bottom-left';
        } else {
            orientation = (trayBounds.x > screen.width / 2) ? 'top-right' : 'top-left';
        }
    } else if (process.platform === 'darwin') {
        orientation = 'top';
    }
  
    switch (orientation) {
        case 'top':
            x = Math.floor(trayBounds.x - appSetting.width / 2 + trayBounds.width / 2);
            y = trayBounds.y + trayBounds.height;
            break;
        case 'top-right':
            x = screen.width - appSetting.width;
            break;
        case 'bottom-left':
            y = screen.height - appSetting.height;
            break;
        case 'bottom-right':
            y = screen.height - appSetting.height;
            x = screen.width - appSetting.width;
            break;
        case 'top-left':
        default:
            x = 0;
            y = 0;
    }
  
    // Normalize any out of bounds
    // maxX accounts for multi-screen setups where x is the coordinate across multiple screens.
    const maxX = screen.width + screen.x;
    x = (x > maxX ) ? maxX - appSetting.width : (x < 0) ? 0 : x;
    y = (y > screen.height) ? screen.height - appSetting.height : (y < 0) ? 0 : y;
    mainWindow.setPosition(x, y);
}
