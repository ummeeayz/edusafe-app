const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const { InjectManifest } = require('workbox-webpack-plugin');

const isProduction = process.env.NODE_ENV === 'production';

const plugins = [
  new HtmlWebpackPlugin({
    template: './public/index.html',
    filename: 'index.html',
  }),
  new CopyPlugin({
    patterns: [
      { from: './public/manifest.json', to: 'manifest.json' },
      { from: './public/img', to: 'img' }
    ],
  }),
];

if (isProduction) {
  plugins.push(
    new InjectManifest({
      swSrc: './public/sw.js',
      swDest: 'sw.js',
    })
  );
}

module.exports = {
  mode: isProduction ? 'production' : 'development',
  entry: './src/js/index.js',
  output: {
    filename: 'bundle.[contenthash].js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
    publicPath: '/edusafe-app/'  // Ensure this matches your repo name if deploying to GitHub Pages
  },
  devServer: {
    static: {
      directory: path.join(__dirname, 'public'),
    },
    open: true,
    hot: true,
    port: 8080,
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      },
      {
        test: /\.css$/,
        use: [
          'style-loader',
          'css-loader',
          'postcss-loader',
        ],
      },
    ]
  },
  plugins,
};
