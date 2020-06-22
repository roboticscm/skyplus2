const webpack = require('webpack');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const path = require('path');

const mode = process.env.NODE_ENV || 'development';
const prod = mode === 'production';
const dev = !prod;
const useCache = process.env.USE_CACHE || 'false';

const magicImporter = require('node-sass-magic-importer');
const sveltePreprocess = require('svelte-preprocess');
const CopyPlugin = require('copy-webpack-plugin');
const onwarn = (warning, onwarn) => warning.code === 'css-unused-selector' || onwarn(warning);

const SpeedMeasurePlugin = require("speed-measure-webpack-plugin");

const smp = new SpeedMeasurePlugin();

const alias = {
      svelte: path.resolve('node_modules', 'svelte'),
      'src': path.resolve(__dirname, 'src'),
      'd': path.resolve(__dirname, 'src/lib/js/debug'),
      // 'bignumber.js$': 'bignumber.js/bignumber.js',
    };
const  HtmlWebpackPlugin = require('html-webpack-plugin');
// const createVariants = require('parallel-webpack').createVariants;
//
// const baseOptions = {
//   preferredDevTool: process.env.DEVTOOL || 'eval'
// };
//
// const variants = {
//   minified: [true, false],
//   debug: [true, false],
//   target: ['commonjs2', 'var', 'umd', 'amd']
// };

// const TerserPlugin = require('terser-webpack-plugin');

module.exports = smp.wrap({
  entry: {
    bundle: ['./src/main.ts'],
  },
  resolve: {
    alias: alias,
    extensions: ['.mjs', '.js', '.ts', '.svelte', '.css', '.scss'],
    mainFields: ['svelte', 'browser', 'module', 'main'],
  },
  output: {
    path: path.resolve(__dirname, '../../www'),
    filename: '[name][hash].js',
    chunkFilename: '[name].[id][hash].js'
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: prod && useCache === 'true' ? [
          {
            loader: 'cache-loader'
          },
          {
            loader: 'ts-loader',
            options: {
              happyPackMode: true,
              transpileOnly: prod
            }
          },
        ] : [
          {
            loader: 'ts-loader',
            options: {
              happyPackMode: true,
              transpileOnly: prod
            }
          },
        ]
      },
      {
        test: /\.svelte$/,
        use: prod && useCache === 'true' ? [
          {
            loader: 'cache-loader'
          },
          {
          loader: 'svelte-loader-hot',
          options: {
            dev,
            onwarn,
            preprocess: sveltePreprocess({
              scss: {
                importer: [magicImporter()],
              },
              typescript: {
                // skips type checking
                transpileOnly: prod ? true : false,
              },
            }),
            hotReload: true,
            hotOptions: {
              // whether to preserve local state (i.e. any `let` variable) or
              // only public props (i.e. `export let ...`)
              noPreserveState: false,
              // optimistic will try to recover from runtime errors happening
              // during component init. This goes funky when your components are
              // not pure enough.
              optimistic: true,
              noReload: true,
              // noPreserveStateKey: '__'
              // See docs of svelte-loader-hot for all available options:
              //
              // https://github.com/rixo/svelte-loader-hot#usage
            },
          },
        }] : [
          {
            loader: 'svelte-loader-hot',
            options: {
              dev,
              onwarn: onwarn,
              preprocess: sveltePreprocess({
                scss: {
                  importer: [magicImporter()],
                },
                typescript: {
                  // skips type checking
                  transpileOnly: prod ? true : false,
                },
              }),
              hotReload: true,
              hotOptions: {
                // whether to preserve local state (i.e. any `let` variable) or
                // only public props (i.e. `export let ...`)
                noPreserveState: false,
                // optimistic will try to recover from runtime errors happening
                // during component init. This goes funky when your components are
                // not pure enough.
                optimistic: true,
                noReload: true,
                // noPreserveStateKey: '__'
                // See docs of svelte-loader-hot for all available options:
                //
                // https://github.com/rixo/svelte-loader-hot#usage
              },
            },
          }
        ],
      },
      {
        test: /\.(md|svg|ico|jpg|jpeg|png|gif|eot|otf|webp|ttf|woff|woff2|cur|ani|pdf|ogg)(\?.*)?$/,
        loader: 'file-loader',
      },
      {
        test: /\.(scss|sass|css)$/,
        use: prod && useCache === 'true' ? [
          {
            loader: 'cache-loader'
          },
          prod ? MiniCssExtractPlugin.loader : 'style-loader',
          { loader: 'css-loader', options: { sourceMap: true } },
          {
            loader: 'sass-loader',
            options: {
              sassOptions: {
                importer: magicImporter(),
              },
            },
          },
        ] : [
          prod ? MiniCssExtractPlugin.loader : 'style-loader',
          { loader: 'css-loader', options: { sourceMap: true } },
          {
            loader: 'sass-loader',
            options: {
              sassOptions: {
                importer: magicImporter(),
              },
            },
          },
        ],
      },
    ],
  },
  mode,
  plugins: prod ? [
    new CleanWebpackPlugin(),
    new MiniCssExtractPlugin({
      filename: '[name][contenthash].css',
    }),
    new webpack.ProvidePlugin({
      j: 'jquery',
      jQuery: 'jquery',
      'd': 'd'
    }),

    new HtmlWebpackPlugin({
      hash: true,
      template: './public/template.html',
      filename: './index.html'
    }),
    new CopyPlugin([
      // { from: './public/index.html', to: './index.html' },
      { from: './public/favicon.png', to: './favicon.png' },
    ]),
  ] : [
    new MiniCssExtractPlugin({
      filename: '[name][contenthash].css',
    }),
    new webpack.ProvidePlugin({
      j: 'jquery',
      jQuery: 'jquery',
      'd': 'd'
    }),

    new HtmlWebpackPlugin({
      hash: true,
      template: './public/template.html',
      filename: './index.html'
    }),
  ],
  devtool: prod ? false : 'source-map',
  devServer: {
    contentBase: 'public',
    host: '0.0.0.0',
    port: 80,
    hot: true,
    overlay: true,
    historyApiFallback: true,
    disableHostCheck: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
  },
  // optimization: {
  //   minimize: true,
  //   minimizer: [
  //     new TerserPlugin({
  //       parallel: 8,
  //       cache: true,
  //     }),
  //   ],
  // },
});


// module.exports = createVariants(baseOptions, variants, () => config);

