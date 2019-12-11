
import _ from 'lodash';

import { logger } from '../logger';

let cmd = require('child_process'); //子进程
const fs = require('fs');

let cmdSubprocess = {};

/**
 * 
 *
 * 
 */
export function openWhiteBoard() {
    logger('openWhiteBoard');  
    fs.exists('C:\\Program Files\\OpenBoard\\openboard.exe',function(exists){

            if(exists){
        
                    
            cmdSubprocess = cmd.spawn('C:\\Program Files\\OpenBoard\\openboard.exe');
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
        
            else{
        
                    
            cmdSubprocess = cmd.spawn('C:\\Program Files (x86)\\OpenBoard\\openboard.exe');
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
        
        });

}


export function stopWhiteBoard() {

    if (!_.isEmpty(cmdSubprocess)){
        cmdSubprocess.kill();
        cmdSubprocess = {};
    }
}
