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

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use('', Routes);
