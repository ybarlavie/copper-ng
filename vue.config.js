const configureAPI = require('./configure');

module.exports = {
  publicPath: process.env.NODE_ENV === 'production' ? '/copper/' : '/',

  devServer: {
    before: configureAPI
  },

  pluginOptions: {
    quasar: {
      importStrategy: 'manual',
      rtlSupport: true
    }
  },

  transpileDependencies: [
    'quasar'
  ]
}
