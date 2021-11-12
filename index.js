const http = require('http');
const express = require('express');
const Routes = require('./routes');
const cors = require('cors');
const { nextTick } = require('process');
const app = express();

require('dotenv-safe').config();

const server = http.createServer(app);
const PORT = process.env.PORT || 3000;
server.listen(PORT);

var corsOptions = {
  origin: 'http://localhost:52002',
};
//app.use(() => {
//  console.log('da');
//  nextTick();
//});
app.use(express.json());
app.use(cors(corsOptions));
app.use('', Routes);
