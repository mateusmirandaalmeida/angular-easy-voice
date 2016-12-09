var webpack = require('webpack');
var UnminifiedWebpackPlugin = require('unminified-webpack-plugin');
var path = require('path');

module.exports = {
  entry: './main.js',
  output: {
    path: path.join(__dirname, '/dist/'),
    filename: 'EasyVoice.min.js',
    publicPath: '/'
  },
  plugins: [
    new webpack.optimize.UglifyJsPlugin({
      include: /\.min\.js$/,
      minimize: true,
      beautify: true,
      comments: false,
      mangle: false,
      compress: {
          warnings: false
      }
    })
  ],
  module: {
    loaders: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel',
        query: {
          "presets": ["es2015", "stage-0"]
        }
      }
    ]
  }
};
