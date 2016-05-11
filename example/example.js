'use strict';

const GCloudStorageUploader = require('../index');

const uploader = new GCloudStorageUploader();
uploader.upload({
    file: 'file.mp4',
    bucket: 'tus-dev',
});
