const Hapi = require('@hapi/hapi');
const config = require('config');
const DB = require('./db');
const GcpStorage = require('./storage');
const getLogger = require('./logger');
const Comparator = require('./comparator');
const transform = require('./transform');

const pubsubTopic = config.get('pubsubTopic');
const dqrTopicName = config.get('dqrTopic');

class SdrWorker {
    constructor({
                    host,
                    port,
                    name,
                    tasktype,
                    provider,
                    project,
                    bucketName,
                }) {
        this.host = host;
        this.port = port;
        this.tasktype = tasktype;
        this.name = name;
        this.provider = provider;
        this.project = project;
        this.bucketName = bucketName;
        this.server = null;
        this.db = null;
        this.logger = getLogger(this.name);
        this.pubsubTopic = pubsubTopic
    }

    initServer() {
        this.server = Hapi.server({
            port: this.port,
            host: this.host,
        });
    }

    async initDB() {
        this.db = new DB({
            tasktype: this.tasktype,
        });
    }

    initStorage() {
        this.storage = new GcpStorage({
            provider: this.provider,
            project: this.project,
            bucketName: this.bucketName
        });
    }

    async initRoutes() {
        this.server.route({
            method: 'GET',
            path: '/',
            handler: (request, h) => {
                return 'Health check';
            }
        });
        this.server.route({
            method: 'POST',
            path: '/',
            handler: async (request, h) => {
                this.logger.info(`Task received!`);
                this.logger.info(`Task Payload: ${JSON.stringify(request.payload)}`);
                let payload;
                try {
                    // payload = request.payload;
                    payload = JSON.parse(Buffer.from(request.payload).toString());
                } catch (err) {
                    console.error('Buffer parsing error');

                    return h.response().code(500);
                }
                const {gcsFileName} = payload;

                try {
                    const fileGcs = await this.storage.getFile({name: gcsFileName});
                    const {rows: dbItems  = []} = await this.db.getYelpLocations();
                    const comparisonFields = {
                        fieldA: 'long_description',
                        fieldB : 'attributes.AboutThisBizSpecialties'
                    };
                    const comparator = new Comparator({
                        pkA: 'distributor_listings_id',
                        pkB: 'id',
                        sourceItemsA: dbItems,
                        sourceItemsB: fileGcs,
                        comparisonMap: {
                            [comparisonFields.fieldA]: comparisonFields.fieldB
                        }
                    });
                    const result = comparator.compare();
                    await transform.toExcel(result, comparisonFields)
                    return h.response().code(200);
                } catch (err) {
                    console.error(err.message);

                    return h.response().code(500);
                }
            }
        });

    }

    async start() {
        try {
            this.initServer();
            this.initStorage();
            await this.initDB();
            await this.initRoutes();
            await this.server.start();
            this.logger.info(`Server running on ${this.server.info.uri}`);
        } catch (error) {
            this.logger.error(JSON.stringify(error));
        }
    }
}


module.exports = SdrWorker
