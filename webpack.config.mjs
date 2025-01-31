// chrome-extension/webpack.config.mjs

import path from 'path';
import webpack from 'webpack';
import CopyWebpackPlugin from 'copy-webpack-plugin';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const isDev = process.env.NODE_ENV !== 'production';
const mode = isDev ? 'development' : 'production';

const envVariables = {
  'process.env.EXTENSION_NAME': JSON.stringify('OTA Scraper Extension'),
  'process.env.DESCRIPTION': JSON.stringify(
    'Scrape multiple OTA reservation data and send to server.'
  ),

  'process.env.BACKEND_API_URL': JSON.stringify(
    isDev
      ? 'http://localhost:3003'
      : 'https://container-service-1.302qcbg9eaynw.ap-northeast-2.cs.amazonlightsail.com'
  ),
  'process.env.REACT_APP_URL': JSON.stringify(
    isDev ? 'http://localhost:3000' : 'https://staysync.me'
  ),
};

export default {
  mode,
  entry: {
    background: path.resolve(__dirname, 'src/background.js'),

    goodMotel: path.resolve(__dirname, 'src/content-scripts/goodMotel.js'),

    goodHotel: path.resolve(__dirname, 'src/content-scripts/goodHotel.js'),

    agoda: path.resolve(__dirname, 'src/content-scripts/agoda.js'),

    yanolja: path.resolve(__dirname, 'src/content-scripts/yanolja.js'),

    booking: path.resolve(__dirname, 'src/content-scripts/booking.js'),

    expedia: path.resolve(__dirname, 'src/content-scripts/expedia.js'),

    coolStay: path.resolve(__dirname, 'src/content-scripts/coolStay.js'),
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].bundle.js',
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
          },
        },
      },
    ],
  },
  resolve: {
    extensions: ['.js'],
  },
  plugins: [
    new webpack.DefinePlugin(envVariables),

    new CopyWebpackPlugin({
      patterns: [
        {
          from: 'src/manifest.json',
          to: 'manifest.json',
          transform(content) {
            const manifestStr = content
              .toString()
              .replace(
                /\$\{EXTENSION_NAME\}/g,
                envVariables['process.env.EXTENSION_NAME']
              );

            return Buffer.from(manifestStr);
          },
        },
        {
          from: 'src/images',
          to: 'images',
        },
      ],
    }),

    new webpack.ContextReplacementPlugin(/dayjs[/\\]locale$/, /en|ko/),
  ],

  devtool: 'source-map',
};
