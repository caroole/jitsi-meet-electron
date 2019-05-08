
import _ from 'lodash';

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

/**
 * 
 *
 * 
 */
export function startFFMpeg() {
    videoSubprocess = video.spawn("ffmpeg", ['-y','-rtbufsize', '50M', "-f", "dshow", "-video_size","1920x1080","-framerate","30","-pixel_format","yuv420p","-i", 'video=screen-capture-recorder', "-loglevel","quiet", userDir+'/desktop.mp4']);
    videoSubprocess.on('close', function(code) {
        console.warn('videoSubprocess exited with code :' + code);
        videoSubprocess = {};
        
        var notify = {};
        if(code == 0){       
            notify.notifyID = 'video-succeed';
        }
        else {
            notify.notifyID = 'video-failed';
        }
        ipc.send('manager-main',notify);
    });
    videoSubprocess.stdout.on('data', function(data) {
        console.warn('videoSubprocess stdout: ' + data);
    });
    videoSubprocess.stderr.on('data', function(data) {
        console.warn('videoSubprocess stderr: ' + data);

    });
    audeoSubprocess = audeo.spawn("ffmpeg", ['-y',"-f", "dshow", "-i", 'audio=virtual-audio-capturer', "-loglevel","quiet", userDir+'/record.mp3']);
    audeoSubprocess.on('close', function(code) {
        console.warn('audeoSubprocess exited with code :' + code);
        audeoSubprocess = {};
        var notify = {};
        if(code == 0){       
            notify.notifyID = 'audio-succeed';
        }
        else {
            notify.notifyID = 'audio-failed';
        }
        ipc.send('manager-main',notify);
    });
    audeoSubprocess.stdout.on('data', function(data) {
        console.warn('audeoSubprocess stdout: ' + data);
    });
    audeoSubprocess.stderr.on('data', function(data) {
        console.warn('audeoSubprocess stderr: ' + data);

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
    console.log('mergeMediaFile filepath:'+filepath);
    _mixAudioFile(filepath);

}

function _mixAudioFile(filepath){

    mixAudioSubprocess = mix_audeo.spawn("ffmpeg", ['-y','-i', userDir + "/temp.flac", "-i", userDir+'/record.mp3', "-filter_complex", '[0]adelay=10|10[del0],[del0][1]amix',"-loglevel","quiet", userDir+'/record_mix.mp3']);
    mixAudioSubprocess.on('close', function(code) {
        console.warn('mixAudioSubprocess exited with code :' + code);
        mixAudioSubprocess = {};
        let notify = {};
        notify.filepath = filepath;
        if(code == 0){
            _mixVideoFile(filepath);            
            let states = fs.statSync(userDir+'/desktop.mp4');
            
            notify.notifyID = 'audio-mix-succeed';
            notify.needTime = states.size / 10000000;
        }
        else {
            notify.notifyID = 'audio-mix-failed';
        }
        ipc.send('main-loading',notify);
    });
    mixAudioSubprocess.stdout.on('data', function(data) {
        console.warn('mixAudioSubprocess stdout: ' + data);
    });
    mixAudioSubprocess.stderr.on('data', function(data) {
        console.warn('mixAudioSubprocess stderr: ' + data);

    });
}


function _mixVideoFile(filepath){

    mixVideoSubprocess = mix_video.spawn("ffmpeg", ['-y','-i', userDir+'/desktop.mp4', "-i", userDir+'/record_mix.mp3', "-filter_complex", "adelay=10|10", "-c:v","copy","-c:a","aac","-strict","experimental","-loglevel","quiet", filepath]);
    mixVideoSubprocess.on('close', function(code) {
        console.warn('mixVideoSubprocess exited with code :' + code);
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
        console.warn('mixVideoSubprocess stdout: ' + data);
    });
    mixVideoSubprocess.stderr.on('data', function(data) {
        console.warn('mixVideoSubprocess stderr: ' + data);

    });
}