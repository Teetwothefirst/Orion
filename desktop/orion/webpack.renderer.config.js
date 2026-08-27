const rules = require('./webpack.rules');

rules.push({
  test: /\.css$/,
  use: [
    { loader: 'style-loader' }, 
    { loader: 'css-loader' },
    {
      loader: 'postcss-loader',
      options: {
        postcssOptions: {
          plugins: [
            require('@tailwindcss/postcss')
          ]
        }
      }
    }
  ],
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
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.json', '.css'],
    fallback: {
      "path": false,
      "fs": false,
      "crypto": false
    }
  }
};
