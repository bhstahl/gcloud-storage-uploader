'use strict';

const GCloudStorageUploader = require('../index');
const params = {
    method: 'POST',
};

const request = new GCloudStorageUploader.GCloudRequest(params);
console.log(request);
