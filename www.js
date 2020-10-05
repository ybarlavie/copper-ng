const { resolve } = require('path');
const history = require('connect-history-api-fallback');
const express = require('express');
const configureAPI = require('./configure');
const authUtils = require('./authUtils');
const cookieParser = require('cookie-parser');

const { PORT = 3000 } = process.env

// global tokenCache - avalable app-wide - must not be declared with var/const
tokensCache = {};
loggedInTokens = {};
// global tokenCache - avalable app-wide - must not be declared with var/const

const app = express();

// UI
const publicPath = resolve(__dirname, './dist')
const staticConf = { maxAge: '1y', etag: false }

// API
configureAPI(app)

// PUBLICS
app.use('/', express.static(publicPath, staticConf))
app.use('/', history())



// Go
var server = app.listen(PORT, () => console.log(`App running on port ${PORT}!`));
server.setTimeout(600000);