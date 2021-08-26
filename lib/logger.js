const winston = require('winston');
const { LoggingWinston } = require('@google-cloud/logging-winston');

const getLogger = (serviceName) => {
    const transports = [new winston.transports.Console()];
    if(process.env.NODE_ENV !== 'local') {
        const loggingWinston = new LoggingWinston({ logName: 'sdr', level: 'info' });
        // Add Stackdriver Logging for GAE environment
        transports.push(loggingWinston);
    }
    const logger = winston.createLogger({
        transports,
        defaultMeta: { service: serviceName },
    });
    return logger;
};

module.exports = getLogger;
