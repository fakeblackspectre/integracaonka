const logger = require('./logs');

function handleError(err, message) {
  logger.error(err);
  throw new Error(message);
}

module.exports = { handleError };
