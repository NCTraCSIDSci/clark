const merge = require('webpack-merge');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const common = require('./webpack.config');

module.exports = merge(common, {
  mode: 'production',
  entry: ['./ui/index.jsx'],
  output: {
    path: path.join(__dirname, 'build_ui'),
    publicPath: './',
    filename: 'bundle.js',
    libraryTarget: 'umd',
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './ui/index.html',
    }),
  ],
});
