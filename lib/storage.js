let Storage;
try {
    const gcloud = require('@google-cloud/storage');
    Storage = gcloud.Storage;
} catch (err) {
    console.error('GCloud is not supported');
}

class GCS {
    constructor({provider, project, bucketName}) {
        if (GCS._instance) {
            return GCS._instance;
        }

        GCS._instance = this;

        this.provider = provider;
        if (Storage) {
            this.storage = new Storage({
                projectId: project
            });
            this.bucket = this.storage.bucket(bucketName);
        }
    }

    async getFile({name}) {
        this.fileName = name;
        const stream = this.bucket.file(name).createReadStream();
        let result = '';

        return new Promise((resolve, reject) => {
            stream
                .on('data', data => {
                    result += data;
                })
                .on('end', () => {
                    resolve(finish(result));
                })
                .on('error', err => {
                    console.error(err);
                    reject(err);
                });

            function finish(jsonHeap) {
                const strs = jsonHeap.split('\n');
                // last string is throwing 'Unexpected end of JSON input' because it is empty, get rid of it
                strs.pop();

                console.log(`Downloaded ${strs.length} Yelp items from GCloud`);
                try {
                    return strs.map((json, index) => {
                        // console.debug({index})
                        return JSON.parse(json)
                    });
                } catch (err) {
                    console.error(`Error while parsing json items. Error: ${err}`);
                    throw err;
                }
            }
        });
    }

    async uploadComparison(workBook) {
        const fileName = this.generateFileName();

        const file = this.bucket.file(fileName);
        try {
            await file.save(workBook);
        } catch (err) {
            console.error(`Uploading raw data failure. Error: ${err}`);

            throw err;
        }
    }

    generateFileName() {
        return `comparison/${this.fileName}.csv`;
    }
}

module.exports = GCS;

