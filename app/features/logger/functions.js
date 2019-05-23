
const ipc = require('electron').ipcRenderer;


/**
 * 
 *
 * 
 */
export function log(msg) {    
    let notify = {};
    notify.msg = msg;
    notify.notifyID = 'notify_log'
    ipc.send('manager-main',notify);
}