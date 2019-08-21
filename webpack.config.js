const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const config = {
  entry: ['./ui/index.jsx'],
  target: 'electron-renderer',
  mode: 'development',
  devtool: 'cheap-module-eval-source-map',
  output: {
    path: path.join(__dirname, 'build_ui'),
    publicPath: './',
    filename: 'bundle.js',
    libraryTarget: 'umd',
  },
  resolve: {
    extensions: ['.mjs', '.js', '.jsx', '.json'],
    modules: [
      path.join(__dirname, '.'),
      'node_modules',
    ],
  },
  module: {
    rules: [
      {
        test: /\.js(x?)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            cacheDirectory: true,
            babelrc: false,
            presets: ['@babel/preset-env', '@babel/preset-react'].map(require.resolve),
            plugins: ['transform-class-properties', 'transform-export-extensions', 'transform-react-jsx'],
          },
        },
      },
      {
        test: /\.mjs$/,
        include: /node_modules/,
        type: 'javascript/auto',
      },
      {
        test: /\.css$/,
        use: [
          { loader: 'style-loader' },
          { loader: 'css-loader' },
        ],
      },
      {
        test: /\.(png|jpg|gif|ico)$/,
        loader: 'file-loader?name=[name].[ext]',
      },
      {
        test: /\.(ttf|eot|svg|woff(2)?)(\?[a-z0-9=&.]+)?$/,
        loader: 'url-loader',
      },
      {
        test: /\.node$/,
        use: 'node-loader',
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './ui/index.html',
    }),
  ],
};

module.exports = config;
