/* global __dirname, process */

const {
    BrowserWindow,
    Menu,
    app,
    shell
} = require('electron');
const isDev = require('electron-is-dev');
// const { autoUpdater } = require('electron-updater');
const windowStateKeeper = require('electron-window-state');
const {
    initPopupsConfigurationMain,
    getPopupTarget,
    setupAlwaysOnTopMain
} = require('jitsi-meet-electron-utils');
const path = require('path');
const URL = require('url');
const ipc = require('electron').ipcMain;

logger = require('electron-log');
logger.transports.file.level = 'info';
logger.transports.file.maxSize = 10 * 1024 * 1024;
/**
 * When in development mode:
 * - Load debug utilities (don't open the DevTools window by default though)
 * - Enable automatic reloads
 */
if (isDev) {
    require('electron-debug')({ showDevTools: false });
    require('electron-reload')(path.join(__dirname, 'build'));
}

/**
 * The window object that will load the iframe with Jitsi Meet.
 * IMPORTANT: Must be defined as global in order to not be garbage collected
 * acidentally.
 */
var mainWindow = null;
var managerWin = null;
var loadingWin = null;
var basePath = null;
var mainTitle = '果视科技';

const dialog = require('electron').dialog;
ipc.on('showManagerWindow', (sys, isShow) => {
    if(isShow){
        managerWin.show();
    }
    else{        
        managerWin.hide();
    }
  });
ipc.on('main-manager',(sys, msg) => {
    if(msg.notifyID !== 'notify_log'){
        logger.info("main-manager:"+msg.notifyID);
    }
    switch( msg.notifyID ) {
        case 'videoConferenceJoined':
            if ( mainWindow ){
                mainWindow.setTitle(mainTitle + ' 会议室: ' + msg.conferenceInfo.roomName);
            }
            break;
        case 'conferenceFinished':
            if ( mainWindow ){
                mainWindow.setTitle(mainTitle);
            }
            return;
        case 'saveAudioFile':
            const options = {
                title: '保存',
                filters: [
                  { name: '录像文件', extensions: ['mp4'] }
                ]
              }
            dialog.showSaveDialog(options, function (filename) {
                if (filename) {
                    openLoading(filename);
                }
              });
            return;
        case 'notify_log':
            logger.info(msg.msg);
            return;
    }
    // if ( msg.notifyID === 'videoConferenceJoined'){
    //     if ( mainWindow ){
    //         mainWindow.setTitle(mainTitle + ' 会议室: ' + msg.conferenceInfo.roomName);
    //     }
    // }
    // else if ( msg.notifyID === 'conferenceFinished' ){
    //     if ( mainWindow ){
    //         mainWindow.setTitle(mainTitle);
    //     }
    //     return;
    // }
    // else if ( msg.notifyID === 'saveAudioFile' ){
    //     const options = {
    //         title: '保存',
    //         filters: [
    //           { name: '录像文件', extensions: ['mp4'] }
    //         ]
    //       }
    //     dialog.showSaveDialog(options, function (filename) {
    //         if (filename) {
    //             let command={};
    //             command.cmd = 'saveCallBack';
    //             command.msg = filename;
    //             mainWindow.webContents.send('manager-main',command);
    //             openLoading();
    //         }
    //       });
    //     return;
    // }
    managerWin.webContents.send('main-manager',msg);
  });
ipc.on('manager-main',(sys, msg) => {
    logger.info("manager-main:"+msg.cmd);
    mainWindow.webContents.send('manager-main',msg);
  });

ipc.on('main-loading',(sys, msg) => {
    
    logger.info("main-loading:"+msg.notifyID+":"+loadingWin);
    if (loadingWin){
        loadingWin.webContents.send('main-loading',msg);
    }
});
function readyForMerge(f){

    let command={};
    command.cmd = 'saveCallBack';
    command.msg = f;
    mainWindow.webContents.send('manager-main',command);
}
function openLoading(f){
    if (loadingWin){
        loadingWin.show();
        readyForMerge(f);
    }
    else {

        loadingWin = new BrowserWindow({
            width: 530, height: 270, 
            icon: path.resolve(basePath, './resources/icons/icon_512x512.png'),
            maximizable: false, minimizable: false, resizable: false, show: false, alwaysOnTop: true})
        
        const indexLoadingWinURL = URL.format({
            pathname: path.resolve(basePath, './build/loading/loading.html'),
            protocol: 'file:',
            slashes: true
        });
        loadingWin.loadURL(indexLoadingWinURL);
        loadingWin.once('ready-to-show', () => {
            loadingWin.show();
            readyForMerge(f);
        });
        loadingWin.on('closed', () => {
            loadingWin = null;    
        });
        // loadingWin.openDevTools();
    }
}
/**
 * Sets the application menu. It is hidden on all platforms except macOS because
 * otherwise copy and paste functionality is not available.
 */
function setApplicationMenu() {
    if (process.platform === 'darwin') {
        const template = [ {
            label: app.getName(),
            submenu: [ {
                label: 'Quit',
                accelerator: 'Command+Q',
                click() {
                    app.quit();
                }
            } ]
        }, {
            label: 'Edit',
            submenu: [ {
                label: 'Undo',
                accelerator: 'CmdOrCtrl+Z',
                selector: 'undo:'
            },
            {
                label: 'Redo',
                accelerator: 'Shift+CmdOrCtrl+Z',
                selector: 'redo:'
            },
            {
                type: 'separator'
            },
            {
                label: 'Cut',
                accelerator: 'CmdOrCtrl+X',
                selector: 'cut:'
            },
            {
                label: 'Copy',
                accelerator: 'CmdOrCtrl+C',
                selector: 'copy:'
            },
            {
                label: 'Paste',
                accelerator: 'CmdOrCtrl+V',
                selector: 'paste:'
            },
            {
                label: 'Select All',
                accelerator: 'CmdOrCtrl+A',
                selector: 'selectAll:'
            }
            ]
        } ];

        Menu.setApplicationMenu(Menu.buildFromTemplate(template));
    } else {
        Menu.setApplicationMenu(null);
    }
}

/**
 * Opens new window with index.html(Jitsi Meet is loaded in iframe there).
 */
function createJitsiMeetWindow() {
    logger.info("createJitsiMeetWindow enter");
    // Application menu.
    setApplicationMenu();

    // Check for Updates.
    //autoUpdater.checkForUpdatesAndNotify();

    // Load the previous window state with fallback to defaults.
    const windowState = windowStateKeeper({
        defaultWidth: 800,
        defaultHeight: 600
    });

    // Path to root directory.
    basePath = isDev ? __dirname : app.getAppPath();

    // URL for index.html which will be our entry point.
    const indexURL = URL.format({
        pathname: path.resolve(basePath, './build/index.html'),
        protocol: 'file:',
        slashes: true
    });

    // Options used when creating the main Jitsi Meet window.
    const options = {
        x: windowState.x,
        y: windowState.y,
        width: windowState.width,
        height: windowState.height,
        icon: path.resolve(basePath, './resources/icons/icon_512x512.png'),
        minWidth: 800,
        minHeight: 600,
        show: false,
        title: mainTitle,
        webPreferences: {
            nativeWindowOpen: true
        }
    };

    mainWindow = new BrowserWindow(options);

    windowState.manage(mainWindow);
    mainWindow.loadURL(indexURL);
    const indexManagerWinURL = URL.format({
        pathname: path.resolve(basePath, './build/mgrwin/mgrwin.html'),
        protocol: 'file:',
        slashes: true
    });
    managerWin = new BrowserWindow({ width: 615, 
        height: 700, show: false ,
        icon: path.resolve(basePath, './resources/icons/icon_512x512.png'),
        maximizable: false });
    managerWin.loadURL(indexManagerWinURL);
    managerWin.on('close',(e)=>{
        e.preventDefault();
        managerWin.hide();
    })
    // managerWin.webContents.openDevTools();

    // mainWindow.webContents.openDevTools();
    initPopupsConfigurationMain(mainWindow);
    setupAlwaysOnTopMain(mainWindow);

    mainWindow.webContents.on('new-window', (event, url, frameName) => {
        const target = getPopupTarget(url, frameName);

        if (!target || target === 'browser') {
            event.preventDefault();
            shell.openExternal(url);
        }
    });
    mainWindow.on('close', (e) => {
        if( loadingWin ){
            loadingWin.show();
            // dialog.showErrorBox("录像转储对话框未关闭，请关闭后重试！","");
            e.preventDefault();
            return;
        }
    });
    mainWindow.on('closed', () => {
        mainWindow = null;
        managerWin.destroy();
        managerWin = null;
    });
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });
}

/**
 * Force Single Instance Application.
 */
const gotInstanceLock = app.requestSingleInstanceLock();

if (!gotInstanceLock) {
    app.quit();
    process.exit(0);
}

/**
 * Run the application.
 */

app.on('activate', () => {
    if (mainWindow === null) {
        createJitsiMeetWindow();
    }
});

app.on('certificate-error',
    // eslint-disable-next-line max-params
    (event, webContents, url, error, certificate, callback) => {

        event.preventDefault();
        callback(true);
        // if (url.startsWith('https://localhost')) {
        //     event.preventDefault();
        //     callback(true);
        // } else {
        //     callback(false);
        // }
    }
);

app.on('ready', createJitsiMeetWindow);

app.on('second-instance', () => {
    /**
     * If someone creates second instance of the application, set focus on
     * existing window.
     */
    if (mainWindow) {
        mainWindow.isMinimized() && mainWindow.restore();
        mainWindow.focus();
    }
});

app.on('window-all-closed', () => {
    // Don't quit the application on macOS.
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
