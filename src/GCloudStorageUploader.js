'use strict';

const googleAuth = require('google-auto-auth');
const assign = require('object-assign');
const request = require('request');
const fs = require('fs');

const DEFAULT_CONFIG = {
    keyFilename: 'keyfile.json',
    scopes: ['https://www.googleapis.com/auth/devstorage.full_control'],
};

class GCloudStorageUploader {
    constructor(authConfig) {
        this.authConfig = assign(DEFAULT_CONFIG, authConfig);
        this.authClient = googleAuth(this.authConfig);
    }

    /**
     * [_getEndpoint description]
     * @param  {[type]} config [description]
     * @return {[type]}         [description]
     */
    _getEndpoint(config) {
        config.fileName = config.fileName || config.file.split('/').pop();
        config.fileName = `${new Date().getTime()}_${config.fileName}`;

        return new Promise((resolve, reject) => {
            const params = {
                method: 'POST',
                uri: `https://www.googleapis.com/upload/storage/v1/b/${config.bucket}/o`,
                qs: {
                    name: config.fileName,
                    uploadType: 'resumable',
                },
                json: config.metadata || {},
                headers: {},
            };

            this.authClient.authorizeRequest(params, (authError, paramsWithAuth) => {
                if (authError) {
                    console.log(authError);
                    reject(authError);
                    return;
                }

                request(paramsWithAuth, (error, response, body) => {

                    if (error || response.statusCode !== 200 || !response.headers.location) {
                        const reason = `${response.statusCode}: ${response.statusMessage}`;
                        console.log(`[GCloudStorageUploader._getEndpoint] ${reason}`);
                        reject(`Failed to create endpoint - ${reason}`);
                    }

                    config.uri = response.headers.location;
                    resolve(config);
                });
            });
        });
    }

    _sendFile(config) {
        return new Promise((resolve, reject) => {
            config.offset = parseInt(config.offset, 10);
            config.offset = isNaN(config.offset) ? 0 : config.offset;

            config.chunkSize = parseInt(config.chunkSize, 10);
            config.chunkSize = isNaN(config.chunkSize) ? '*' : config.chunkSize;

            config.contentLength = config.metadata ? parseInt(config.metadata.contentLength, 10) : NaN;
            config.contentLength = isNaN(config.contentLength) ? '*' : config.contentLength;

            const params = {
                method: 'PUT',
                uri: config.uri,
                qs: {
                    name: config.fileName,
                    uploadType: 'resumable',
                },
                json: config.metadata || {},
                headers: {
                    'Content-Range': `bytes ${config.offset}-${config.chunkSize}/${config.contentLength}`,
                    'X-Upload-Content-Length': config.contentLength,
                },
            };

            this.authClient.authorizeRequest(params, (authError, paramsWithAuth) => {
                if (authError) {
                    console.log(authError);
                    reject(authError);
                    return;
                }

                const requestStream = request(paramsWithAuth);
                requestStream.on('error', (resp) => {
                    console.log('Upload.onError', resp);
                });

                requestStream.on('data', (chunk, enc) => {
                    console.log('Upload.data', chunk.length);
                });

                requestStream.on('response', (resp) => {
                    console.log('Upload.onResponse', resp.statusCode);
                    console.log('Upload.onResponse', resp.statusMessage);
                    console.log('Upload.onResponse', resp.headers);
                });

                fs.createReadStream(config.file)
                    .pipe(requestStream)
                    .on('finish', resolve);
            });
        });
    }

    upload(config) {
        return this._getEndpoint(config)
            .then(this._sendFile.bind(this))
            .then(console.log)
            .catch(console.log);
    }
}

module.exports = GCloudStorageUploader;
