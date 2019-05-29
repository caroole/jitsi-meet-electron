/* global process */

// @flow

import { shell } from 'electron';
import config from '../config';
import jitsiLocalStorage from './JitsiLocalStorage';

/**
 * Returns the URL of the external_api.js of the server.
 *
 * @param {string} serverURL - Jitsi Meet Server URL.
 * @returns {string} - The external_api.js URL.
 */
export function getExternalApiURL(serverURL: string) {
    if (!serverURL) {
        // eslint-disable-next-line no-param-reassign
        serverURL = config.defaultServerURL;
    }

    return `${normalizeServerURL(serverURL)}/external_api.js?v=11`;
}

/**
 * Return true if Electron app is running on Mac system.
 *
 * @returns {boolean}
 */
export function isElectronMac() {
    return process.platform === 'darwin';
}

/**
 * Normalizes the given server URL so it has the proper scheme.
 *
 * @param {string} url - URL with or without scheme.
 * @returns {string}
 */
export function normalizeServerURL(url: string) {
    // eslint-disable-next-line no-param-reassign
    url = url.trim();

    if (url && url.indexOf('://') === -1) {
        return `https://${url}`;
    }

    return url;
}

/**
 * Opens the provided link in default broswer.
 *
 * @param {string} link - Link to open outside the desktop app.
 * @returns {void}
 */
export function openExternalLink(link: string) {
    shell.openExternal(link);
}

/**
 * 
 */
export function convertForTrans(uri: ?string) {
    const displayName = jitsiLocalStorage.getItem("roomName_"+uri);
    if( displayName && displayName.length > 0){
        return displayName;
    }

    return uri;
}