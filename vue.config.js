// https://dennisreimann.de/articles/vue-cli-serve-express.html

const configureAPI = require('./configure');

module.exports = {
    lintOnSave: false,
    publicPath: process.env.NODE_ENV === 'production' ? '/copper/' : '/',
    devServer: {
        before: configureAPI
    }
}
