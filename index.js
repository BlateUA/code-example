const Worker = require('./lib/worker.js');
const config = require('config');

const worker = new Worker({
    name: 'dqr-yelp',
    tasktype: 'dqr.yelp',
    provider: 'yelp',
    bucketName: config.storage.bucket.get(process.env.NODE_ENV),
    project: config.storage.project.get(process.env.NODE_ENV),
    host: '0.0.0.0',
    port: process.env.PORT || 8080,
});

worker.start();
