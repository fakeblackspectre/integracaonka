const express = require('express');

const app = express();

app.get('/', (req, res) => {
  const sql = require('mssql');

  // config for your database
  const config = {
    user: 'sa',
    password: '',
    server: '.SQL2014',
    database: 'Clinicas_barc',
  };

  // connect to your database
  sql.connect(config, (err) => {
    if (err) console.log(err);

    // create Request object
    const request = new sql.Request();

    // query to the database and get the records
    request.query('select * from Student', (err, recordset) => {
      if (err) console.log(err);

      // send records as a response
      res.send(recordset);
    });
  });
});

const server = app.listen(5000, () => {
  console.log('Server is running..');
});
