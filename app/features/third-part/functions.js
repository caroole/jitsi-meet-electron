
import _ from 'lodash';

import { logger } from '../logger';

let cmd = require('child_process'); //子进程

let cmdSubprocess = {};

/**
 * 
 *
 * 
 */
export function openWhiteBoard() {
    logger('openWhiteBoard');  

    cmdSubprocess = cmd.spawn("openboard");
    cmdSubprocess.on('close', function(code) {
        logger('openWhiteBoard exited with code :' + code);
        cmdSubprocess = {};
    });
    cmdSubprocess.stdout.on('data', function(data) {
        logger('openWhiteBoard stdout: ' + data);
    });
    cmdSubprocess.stderr.on('data', function(data) {
        logger('openWhiteBoard stderr: ' + data);

    });

}


export function stopWhiteBoard() {

    if (!_.isEmpty(cmdSubprocess)){
        cmdSubprocess.kill();
        cmdSubprocess = {};
    }
    // cmdSubprocess = cmd.spawn("tskill openboard");
    // cmdSubprocess.on('close', function(code) {
    //     logger('stopWhiteBoard exited with code :' + code);
    //     cmdSubprocess = {};
    // });
    // cmdSubprocess.stdout.on('data', function(data) {
    //     logger('stopWhiteBoard stdout: ' + data);
    // });
    // cmdSubprocess.stderr.on('data', function(data) {
    //     logger('stopWhiteBoard stderr: ' + data);

    // });
}
