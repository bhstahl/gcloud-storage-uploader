'use strict';

const googleAuth = require('google-auto-auth');
const assign = require('object-assign');

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
     * @param  {[type]} options [description]
     * @return {[type]}         [description]
     */
    _getAuthorization(options) {
        return new Promise((resolve, reject) => {
            const params = {
                method: 'POST',
                uri: `https://www.googleapis.com/upload/storage/v1/b/${options.bucket}/o`,
                qs: {
                    name: options.file,
                    uploadType: 'resumable',
                },
                json: options.metadata || {},
                headers: {},
            };

            this.authClient.authorizeRequest(params, (error, response) => {
                if (error) {
                    console.log(error);
                    reject(error);
                    return;
                }

                resolve(response);
            });
        });
    }


    upload(options) {
        return this._getAuthorization(options)
            .then(console.log)
            .catch(console.log);
    }
}

module.exports = GCloudStorageUploader;
