const path = require('path')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
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
    extensions: [".tsx", ".ts", ".js"],
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@usecase": path.resolve(__dirname,"src/usecase"),
      "@db": path.resolve(__dirname,"src/db"),
      "@types": path.resolve(__dirname,"src/types"),
      "@tests": path.resolve(__dirname,"src/tests"),
      "@utils": path.resolve(__dirname,"src/utils"),
    }
  },
}
