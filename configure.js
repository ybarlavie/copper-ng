const bodyParser = require('body-parser');
const logger = require('morgan');
const dbRouter = require('./routes/db');

module.exports = app => {
    app.use(bodyParser.json());
    app.use(logger('dev'));
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({
        extended: false
    }));

    app.use('/api/db', dbRouter);
}
