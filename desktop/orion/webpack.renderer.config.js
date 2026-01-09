const rules = require('./webpack.rules');

rules.push({
  test: /\.css$/,
  use: [{ loader: 'style-loader' }, { loader: 'css-loader' }],
});

const Dotenv = require('dotenv-webpack');

module.exports = {
  devtool: 'eval-cheap-module-source-map',
  // Put your normal webpack config below here
  module: {
    rules,
  },
  plugins: [
    new Dotenv({
      systemvars: true
    }),
    new (require('webpack').DefinePlugin)({
      'process.env.GIPHY_API_KEY': JSON.stringify(process.env.GIPHY_API_KEY || '')
    })
  ],
  resolve: {
    fallback: {
      "path": false,
      "fs": false,
      "crypto": false
    }
  }
};
