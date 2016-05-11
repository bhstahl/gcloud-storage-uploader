'use strict';

const googleAuth = require('google-auto-auth');
const assign = require('object-assign');
const request = require('request');

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
     * [_getAuthorization description]
     * @param  {[type]} config [description]
     * @return {[type]}         [description]
     */
    _getAuthorization(config) {
        const fileName = config.fileName || config.file.split('/').pop();

        return new Promise((resolve, reject) => {
            const params = {
                method: 'POST',
                uri: `https://www.googleapis.com/upload/storage/v1/b/${config.bucket}/o`,
                qs: {
                    name: fileName,
                    uploadType: 'resumable',
                },
                json: config.metadata || {},
                headers: {},
            };

            this.authClient.authorizeRequest(params, (error, paramsWithAuth) => {
                if (error) {
                    console.log(error);
                    return reject(error);
                }

                return resolve({
                    config,
                    paramsWithAuth,
                });
            });
        });
    }

    /**
     * [_getEndpoint description]
     * @param  {[type]} options [description]
     * @return {[type]}         [description]
     */
    _getEndpoint(options) {
        return new Promise((resolve, reject) => {
            request(options.requestParams, (error, response, body) => {
                if (error || response.statusCode !== 200 || !response.headers.location) {
                    const reason = `${response.statusCode}: ${response.statusMessage}`;
                    console.log(`[GCloudStorageUploader._getEndpoint] ${reason}`);
                    return reject(`Failed to create endpoint - ${reason}`);
                }

                options.config.uri = response.headers.location;
                return resolve(options.config);
            });
        });
    }

    upload(config) {
        return this._getAuthorization(config)
            .then(this._getEndpoint)
            .then(console.log)
            .catch(console.log);
    }
}

module.exports = GCloudStorageUploader;
