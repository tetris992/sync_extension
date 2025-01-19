// chrome-extension/webpack.config.mjs

import path from 'path';
import webpack from 'webpack';
import CopyWebpackPlugin from 'copy-webpack-plugin';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const mode = process.env.NODE_ENV || 'development';
const isDev = mode === 'development';

const envVariables = {
  'process.env.EXTENSION_NAME': JSON.stringify(
    isDev ? 'OTA Scraper Extension (Dev)' : 'OTA Scraper Extension'
  ),
  'process.env.DESCRIPTION': JSON.stringify(
    isDev
      ? 'Dev: Scrape multiple OTA reservation data and send to local server.'
      : 'Scrape multiple OTA reservation data and send to server.'
  ),
  'process.env.BACKEND_API_URL': JSON.stringify(
    isDev
      ? 'http://localhost:3003' // 개발용
      : 'https://container-service-1.302qcbg9eaynw.ap-northeast-2.cs.amazonlightsail.com'
  ),
  'process.env.REACT_APP_URL': JSON.stringify(
    isDev ? 'http://localhost:3000' : 'https://tetris992.github.io'
  ),
};

export default {
  mode,
  entry: {
    // 백그라운드 스크립트
    background: path.resolve(__dirname, 'src/background.js'),
    // 여기어때모텔 전용 content script
    goodMotel: path.resolve(__dirname, 'src/content-scripts/goodMotel.js'),
    // 여기어때호텔 전용 content script
    goodHotel: path.resolve(__dirname, 'src/content-scripts/goodHotel.js'),
    // 아고다 전용 content script
    agoda: path.resolve(__dirname, 'src/content-scripts/agoda.js'),
    // 야놀자 전용 content script
    yanolja: path.resolve(__dirname, 'src/content-scripts/yanolja.js'),
    // 부킹 전용 content script
    booking: path.resolve(__dirname, 'src/content-scripts/booking.js'),
    // 익스피디아 전용 content script
    expedia: path.resolve(__dirname, 'src/content-scripts/expedia.js'),
    // 꿀스테이 전용 content script
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
            // (기존 transform 로직은 동일)
            const manifestStr = content
              .toString()
              .replace(
                /\$\{EXTENSION_NAME\}/g,
                envVariables['process.env.EXTENSION_NAME']
              );
            // ...
            return Buffer.from(manifestStr);
          },
        },
      ],
    }),
    new webpack.ContextReplacementPlugin(/dayjs[/\\]locale$/, /en|ko/),
  ],
  devtool: 'source-map',
};
