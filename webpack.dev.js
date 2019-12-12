const merge = require('webpack-merge');
const path = require('path');
const webpack = require('webpack');
const common = require('./webpack.config');

module.exports = merge(common, {
  mode: 'development',
  devtool: 'cheap-module-eval-source-map',
  entry: ['webpack/hot/dev-server', './ui/index.jsx'],
  output: {
    path: path.join(__dirname, 'build_ui'),
    filename: 'bundle.js',
    publicPath: 'http://localhost:8080/build_ui',
  },
  devServer: {
    contentBase: path.join(__dirname, 'build_ui'),
    publicPath: 'http://localhost:8080/build_ui',
  },
  plugins: [
    new webpack.IgnorePlugin(new RegExp('^(fs|ipc)$')),
    new webpack.HotModuleReplacementPlugin(),
  ],
});
