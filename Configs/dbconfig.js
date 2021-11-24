// config for your database
require('dotenv-safe').config();

const config = {
  server: process.env.SERVER,
  port: process.env.PORT_DB,
  user: process.env.USER_DB,
  password: '',
  database: process.env.DATABASE,
  options: {
    enableArithAbort: true,
    trustServerCertificate: true,
    encrypt: false,
  },
  connectionTimeout: 15000,
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

module.exports = config;
