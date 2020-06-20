const bodyParser = require('body-parser');
const logger = require('morgan');
const dbRouter = require('./routes/db');
const researchRouter = require('./routes/research');
const batchRouter = require('./routes/batch');

module.exports = (app) => {
    app.use(bodyParser.json());
    app.use(logger('dev'));
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({
        extended: false
    }));

    app.use('/api/db', dbRouter);
    app.use('/api/research', researchRouter);
    app.use('/api/batch', batchRouter);
}
