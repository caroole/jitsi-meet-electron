
import _ from 'lodash';

let video = require('child_process'); //子进程
let audeo = require('child_process'); //子进程
let videoSubprocess = {};
let audeoSubprocess;

/**
 * 
 *
 * 
 */
export function startFFMpeg() {
    let path = "/Users/caroole/Desktop"; //第三方根目录
    videoSubprocess = video.spawn(path + "/ffmpeg", ['-y','-f', 'avfoundation', "-i", '0',path+'/Screen.avi']);
    videoSubprocess.on('close', function(code) {
        console.warn('child process exited with code :' + code);
        videoSubprocess = {};
    });
    videoSubprocess.stdout.on('data', function(data) {
        console.warn('stdout: ' + data);
    });
    videoSubprocess.stderr.on('data', function(data) {
        console.warn('stderr: ' + data);

    });

}


export function stopFFMpeg(data) {
    if (!_.isEmpty(videoSubprocess)){
        videoSubprocess.stdin.write('q');
    }

}

export function mergeMediaFile(filepath){
    console.log('mergeMediaFile filepath:'+filepath);
}