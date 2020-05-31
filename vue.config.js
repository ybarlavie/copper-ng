// https://dennisreimann.de/articles/vue-cli-serve-express.html

const configureAPI = require('./configure')

module.exports = {
    publicPath: "/copper/",
    devServer: {
        before: configureAPI
    }
}
