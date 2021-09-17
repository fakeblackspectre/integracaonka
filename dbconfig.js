 // config for your database

 const config = {
  server: "localhost\\SQL2014",
  port: 1432,
  user: "sa",
  password: "",
  database: "Clinicas_barc",
  options: {
      enableArithAbort: true,
      trustServerCertificate: true,
      encrypt:false
  },
  connectionTimeout: 15000,
  pool: {
      max: 10,
      min: 0,
      idleTimeoutMillis: 30000,
  }
};

module.exports = config;