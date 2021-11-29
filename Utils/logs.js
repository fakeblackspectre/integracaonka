const winston = require('winston');
const moment = require('moment');

const filename = `Logs/Error${moment().format('DDMMYYYYHHMM')}.log`;
const logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.errors({ stack: true }),
    winston.format.timestamp(),
    winston.format.json(),
  ),
  transports: [
    new winston.transports.File({ filename, level: 'error' }),
    // new winston.transports.File({ timespan: true, filename: 'Logs/info.log', level: 'info' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
  );
}

module.exports = logger;
