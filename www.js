const { resolve } = require('path');
const history = require('connect-history-api-fallback');
const express = require('express');
const configureAPI = require('./configure');
const authUtils = require('./authUtils');
const cookieParser = require('cookie-parser');

const { PORT = 3000 } = process.env

const { google } = require('googleapis');
const OAuth2Data = require('./google_key.json');

const CLIENT_ID = OAuth2Data.client.id;
const CLIENT_SECRET = OAuth2Data.client.secret;

// DEBUG ONLY - UNCOMMENT !!!!
const REDIRECT_URL = OAuth2Data.client.redirect;
// DEBUG ONLY - REMOVE !!!!
//const REDIRECT_URL = "http://localhost:" + PORT + "/auth/google/callback";
// DEBUG ONLY - REMOVE !!!!

const oAuth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URL);

// global tokenCache - avalable app-wide - must not be declared with var/const
tokensCache = {};
// global tokenCache - avalable app-wide - must not be declared with var/const

const app = express();

// cookie parser
app.use(cookieParser());

// UI
const publicPath = resolve(__dirname, './dist')
const staticConf = { maxAge: '1y', etag: false }

// AUTHING
const TOKEN_COOKIE_NAME = "copper_ng_token";
const tokenValidMiddleware = (req, res, next) => {
    if (!req.path.startsWith('/api/')) {
        return next();
    }

    console.log('req = ' + req.path);
    
    var token = req.cookies[TOKEN_COOKIE_NAME];
    if (token) {
        var tc = tokensCache[token];
        if (tc) {
            const now = new Date();
            if (tc.expiry_date > now.getTime()) {
                return next();
            }
            console.log('token expired');
            delete tokensCache[token];
        }
    }

    res.clearCookie(TOKEN_COOKIE_NAME);

    // Generate an OAuth URL and redirect there
    const url = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: 'https://www.googleapis.com/auth/gmail.readonly'
    });

    console.log("redirecting to: " + url);
    res.redirect(url);
}

app.use(tokenValidMiddleware);

app.get('/auth/google/callback', function (req, res) {
    const code = req.query.code
    if (code) {
        // Get an access token based on our OAuth code
        oAuth2Client.getToken(code, function (err, tokens) {
            if (err) {
                res.redirect('/AuthError.html?err=' + JSON.stringify(err));
            } else {
                console.log('Successfully authenticated by google');
                oAuth2Client.setCredentials(tokens);
                const gmail = google.gmail({version: 'v1', auth: oAuth2Client})
                gmail.users.getProfile({ userId: 'me' }, (err, {data}) => {
                    if (err) {
                        return res.redirect('/AuthError.html?err=' + JSON.stringify(err));
                    }

                    authUtils.updateToken(data.emailAddress, tokens)
                    .then(result => {
                        res.cookie(TOKEN_COOKIE_NAME, tokens.access_token);
                        res.redirect('/');    
                    }, err => {
                        res.redirect('/AuthError.html?err=' + JSON.stringify(err));
                    });
                });
            }
        });
    }
});

// API
configureAPI(app)

// PUBLICS
app.use(express.static(publicPath, staticConf))
app.use('/', history())

// Go
app.listen(PORT, () => console.log(`App running on port ${PORT}!`))