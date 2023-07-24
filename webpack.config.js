const path = require('path')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const webpack = require('webpack');
const NodemonPlugin = require('nodemon-webpack-plugin');

module.exports = {
  mode: 'development',
  entry: path.resolve(__dirname, './src/index.ts'),
  target: 'node',
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: 'bundle.js',
  },
  plugins: [
    new NodemonPlugin(),
    new CleanWebpackPlugin(),
    // new webpack.HotModuleReplacementPlugin(),
  ],
  module: {
    rules: [
        {
            test: /\.tsx?$/,
            exclude: /node_modules/,
            use: 'ts-loader',
        },
    ],
  },
  resolve: {
    extensions: [ ".tsx", ".ts", ".js" ]
},
  // devServer: {
  //   historyApiFallback: true,
  //   contentBase: path.resolve(__dirname, './dist'),
  //   open: true,
  //   compress: true,
  //   hot: true,
  //   port: 8080,
  // },
}
