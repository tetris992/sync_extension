// chrome-extension/webpack.config.mjs

import path from 'path';
import webpack from 'webpack';
import CopyWebpackPlugin from 'copy-webpack-plugin';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 항상 production 빌드
const mode = 'production';
const isDev = false;

// 프로덕션 환경 변수들
const envVariables = {
  'process.env.EXTENSION_NAME': JSON.stringify('OTA Scraper Extension'),
  'process.env.DESCRIPTION': JSON.stringify(
    'Scrape multiple OTA reservation data and send to server.'
  ),
  'process.env.BACKEND_API_URL': JSON.stringify(
    'https://container-service-1.302qcbg9eaynw.ap-northeast-2.cs.amazonlightsail.com'
  ),
  'process.env.REACT_APP_URL': JSON.stringify(
    'https://staysync.me'
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
    // DefinePlugin으로 env 변수 설정
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
        {
          from: 'src/images', // 실제 아이콘 폴더 경로
          to: 'images', // dist 내에 images 폴더로 복사
        },
      ],
    }),

    // dayjs 로케일 로딩 최적화
    new webpack.ContextReplacementPlugin(/dayjs[/\\]locale$/, /en|ko/),
  ],
  // 프로덕션에서도 소스맵 필요 시
  devtool: 'source-map',
};
