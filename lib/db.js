const config = require('config');
const {Pool} = require('pg');

let db = '', dbRW = '';
if (config.has('dbConfig.pg')) {
    const env = process.env.NODE_ENV || 'development';
    const idleTimeout = config.dbConfig.pg.get('idleTimeout');
    const maxClients = config.dbConfig.pg.get('maxClients');

    //For read only connection
    const rConnectionConfig = {
        host: config.dbConfig.pg.get(env).host,
        user: config.dbConfig.pg.get(env).user,
        password: config.dbConfig.pg.get(env).password,
        port: config.dbConfig.pg.get(env).port,
        database: config.dbConfig.pg.get(env).database,
        idleTimeoutMillis: idleTimeout,
        max: maxClients
    };
    db = new Pool(rConnectionConfig);

    //For read-write connection
    const rwConnectionConfig = {
        connectionString: config.dbConfig.pg.get('rw'),
        user: config.dbConfig.pg.get(env).username,
        password: config.dbConfig.pg.get(env).password,
        idleTimeoutMillis: idleTimeout,
        max: maxClients
    };
    dbRW = new Pool(rwConnectionConfig);
}

class DB {
    constructor() {
        this.pool = db;
        this.poolRW = dbRW;
    }

    async queryDB(query, params) {
        return this.pool.query(query, params);
    }

    async getYelpLocations() {
        const sql = `SELECT field1, field2, field3,
                        FROM table1 as t1
                        inner join table2s as t2 using (field1)
                        inner join table3 as t3 using (field2)
                        WHERE field3 is not null`;

        return this.queryDB(sql);
    }
}

module.exports = DB;
