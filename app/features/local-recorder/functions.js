
import _ from 'lodash';

import { logger } from '../logger';

let video = require('child_process'); //子进程
let audeo = require('child_process'); //子进程
let mix_audeo = require('child_process'); //子进程
let mix_video = require('child_process'); //子进程

const { remote } = require('electron');
const ipc = require('electron').ipcRenderer;
const fs = require('fs');
let userDir = remote.app.getPath('userData');
let videoSubprocess = {};
let audeoSubprocess = {};
let mixAudioSubprocess = {};
let mixVideoSubprocess = {};
let total_length = 0;

/**
 * 
 *
 * 
 */
export function startFFMpeg() {
    logger('startFFMpeg');  

    mixAudioSubprocess = {};
    mixVideoSubprocess = {};

    videoSubprocess = video.spawn("ffmpeg", ['-y',"-f", "gdigrab","-i", 'desktop', "-framerate","15","-vcodec","libx264","-pix_fmt","yuv420p","-preset","ultrafast","-loglevel","quiet", userDir+'/desktop.mp4']);
    videoSubprocess.on('close', function(code) {
        logger('videoSubprocess exited with code :' + code);
        videoSubprocess = {};
        
        var notify = {};
        if(code == 0){       
            notify.notifyID = 'video-succeed';
        }
        else {
            notify.notifyID = 'video-failed';
        }
        ipc.send('main-loading',notify);
    });
    videoSubprocess.stdout.on('data', function(data) {
        logger('videoSubprocess stdout: ' + data);
    });
    videoSubprocess.stderr.on('data', function(data) {
        logger('videoSubprocess stderr: ' + data);

    });
    audeoSubprocess = audeo.spawn("ffmpeg", ['-y',"-f", "dshow", "-i", 'audio=virtual-audio-capturer',"-loglevel","quiet", userDir+'/record.mp3']);
    audeoSubprocess.on('close', function(code) {
        logger('audeoSubprocess exited with code :' + code);
        audeoSubprocess = {};
        var notify = {};
        if(code == 0){       
            notify.notifyID = 'audio-succeed';
        }
        else {
            notify.notifyID = 'audio-failed';
        }
        ipc.send('main-loading',notify);
    });
    audeoSubprocess.stdout.on('data', function(data) {
        logger('audeoSubprocess stdout: ' + data);
    });
    audeoSubprocess.stderr.on('data', function(data) {
        logger('audeoSubprocess stderr: ' + data);

    });


}


export function stopFFMpeg() {
    if (!_.isEmpty(videoSubprocess)){
        videoSubprocess.stdin.write('q');
    }
    if (!_.isEmpty(audeoSubprocess)){
        audeoSubprocess.stdin.write('q');
    }

}

export function mergeMediaFile(filepath){
    logger('mergeMediaFile filepath:'+filepath);

    _mixAudioFile(filepath);

}

function _mixAudioFile(filepath){

    
    total_length = fs.statSync(userDir+'/record.mp3').size;
    mixAudioSubprocess = mix_audeo.spawn("ffmpeg", ['-y','-i', userDir + "/temp.flac", "-i", userDir+'/record.mp3', "-filter_complex", '[0]adelay=10|10[del0],[del0][1]amix', userDir+'/record_mix.mp3']);
    mixAudioSubprocess.on('close', function(code) {
        logger('mixAudioSubprocess exited with code :' + code);
        mixAudioSubprocess = {};
        let notify = {};
        notify.filepath = filepath;
        if(code == 0){
            _mixVideoFile(filepath);            
            notify.notifyID = 'audio-mix-succeed';
        }
        else {
            notify.notifyID = 'audio-mix-failed';
        }
        ipc.send('main-loading',notify);
    });
    mixAudioSubprocess.stdout.on('data', function(data) {
        logger('mixAudioSubprocess stdout: ' + data);
    });
    mixAudioSubprocess.stderr.on('data', function(data) {
        logger('mixAudioSubprocess stderr: ' + data);

        let str = data.toString().replace(/\s*/g,"");
        if(str.indexOf('size=')>-1 && str.indexOf('time=')>-1){
            let size = str.match(/size(\S*)time/)[1];            
            let notify = {};
            notify.total = total_length;    
            notify.mixedLength = parseInt(size.replace("=","").replace("kB",""))*1000;
            notify.notifyID = 'load-process';
            ipc.send('main-loading',notify);            
        }

    });
}


function _mixVideoFile(filepath){

    total_length = fs.statSync(userDir+'/desktop.mp4').size;
    mixVideoSubprocess = mix_video.spawn("ffmpeg", ['-y','-i', userDir+'/desktop.mp4', "-i", userDir+'/record_mix.mp3', "-filter_complex", "adelay=10|10", "-c:v","copy","-c:a","aac","-strict","experimental", filepath]);
    mixVideoSubprocess.on('close', function(code) {
        logger('mixVideoSubprocess exited with code :' + code);
        mixVideoSubprocess = {};
        let notify = {};
        notify.filepath = filepath;
        if(code == 0){        
            notify.notifyID = 'video-mix-succeed';
            
        }
        else {
            notify.notifyID = 'video-mix-failed';
        }
        ipc.send('main-loading',notify);
    });
    mixVideoSubprocess.stdout.on('data', function(data) {
        logger('mixVideoSubprocess stdout: ' + data);
    });
    mixVideoSubprocess.stderr.on('data', function(data) {
        logger('mixVideoSubprocess stderr: ' + data);
        
        let str = data.toString().replace(/\s*/g,"");
        if(str.indexOf('size=')>-1 && str.indexOf('time=')>-1){
            let size = str.match(/size(\S*)time/)[1];            
            let notify = {};
            notify.total = total_length;    
            notify.mixedLength = parseInt(size.replace("=","").replace("kB",""))*1000;
            notify.notifyID = 'load-process';
            ipc.send('main-loading',notify);            
        }

    });
}