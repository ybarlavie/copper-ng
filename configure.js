const bodyParser = require('body-parser');
const logger = require('morgan');
const dbRouter = require('./routes/db');
const researchRouter = require('./routes/research');
const batchRouter = require('./routes/batch');
const authRouter = require('./routes/auth');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const { tokenValidMiddleware } = require('./authUtils');

// global tokenCache - avalable app-wide - must not be declared with var/const
tokensCache = {};
// global tokenCache - avalable app-wide - must not be declared with var/const

module.exports = (app) => {

    require('dotenv').config()
    var det = JSON.parse(process.env.SECRETS);
    process.env.GMAIL_USER = det.username;
    process.env.GMAIL_PASS = det.password;
    console.log("gmail password: " + process.env.GMAIL_PASS);
    process.env.JWT_SECRET = new Buffer(det.jwt_secret, "base64");

    app.use(cookieParser());
    app.use(cors());
    app.use(tokenValidMiddleware);

    app.use(logger('dev'));
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({
        extended: false
    }));

    app.use('/api/db', dbRouter);
    app.use('/api/research', researchRouter);
    app.use('/api/batch', batchRouter);
    app.use('/api/auth', authRouter);
}
