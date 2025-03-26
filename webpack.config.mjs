// chrome-extension/webpack.config.mjs

import path from 'path';
import webpack from 'webpack';
import CopyWebpackPlugin from 'copy-webpack-plugin';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const mode =
  process.env.NODE_ENV === 'production' ? 'production' : 'development';
const envVariables = {
  'process.env.NODE_ENV': JSON.stringify(mode),
  'process.env.BACKEND_API_URL': JSON.stringify(
    mode === 'production' ? 'https://staysync.org' : 'http://localhost:3004'
  ),
  'process.env.REACT_APP_URL': JSON.stringify(
    mode === 'production' ? 'https://staysync.me' : 'http://localhost:3000'
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
