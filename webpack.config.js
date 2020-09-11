const path = require('path');
const HTMLWebpackPlugin = require('html-webpack-plugin');
const {CleanWebpackPlugin} = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const TerserWebpackPlugin = require('terser-webpack-plugin');
const {BundleAnalyzerPlugin} = require('webpack-bundle-analyzer');

const isDev = process.env.NODE_ENV === 'development';
const isProd = !isDev;

const optimization = () => {
  const config = {
    splitChunks: {
      chunks: 'all',
    },
  };
  if (isProd) {
    config.minimizer = [
      new TerserWebpackPlugin(),
    ];
  }

  return config;
};

const fileName = (name, ext) => isDev ?
    `${name}.${ext}` : `${name}.[hash].${ext}`;

const jsLoaders = () => {
  const loaders = [
    {
      loader: 'babel-loader',
      options: {
        presets: ['@babel/preset-env'],
      },
    },
  ];
  if (isDev) {
    loaders.push('eslint-loader');
  }

  return loaders;
};

const cssLoaders = () => {
  const loaders = [
    {
      loader: MiniCssExtractPlugin.loader,
      options: {
        hmr: isDev,
        reloadAll: true,
      },
    },
    'css-loader',
    'sass-loader',
  ];

  if (isProd) {
    const sass = loaders.pop();

    loaders.push({
      loader: 'postcss-loader',
      options: {
        postcssOptions: {
          plugins: [
            require('autoprefixer'),
            require('css-mqpacker'),
            require('cssnano')({
              preset: [
                'default', {
                  discardComments: {
                    removeAll: true,
                  },
                },
              ],
            }),
          ],
        },
      },
    });
    loaders.push(sass);
  }

  return loaders;
};

const plugins = () => {
  const base = [
    new CleanWebpackPlugin(),
    new HTMLWebpackPlugin({
      template: 'index.html',
      minify: {
        collapseWhitespace: isProd,
        removeComments: isProd,
      },
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, 'src/img'),
          to: path.resolve(__dirname, 'build/img'),
        },
        {
          from: path.resolve(__dirname, 'src/favicon'),
          to: path.resolve(__dirname, 'build/favicon'),
        },
      ],
    }),
    new MiniCssExtractPlugin({
      filename: fileName('style', 'css'),
    }),
  ];

  if (isProd) {
    base.push(new BundleAnalyzerPlugin());
  }

  return base;
};

module.exports = {
  context: path.resolve(__dirname, 'src'),
  mode: 'development',
  entry: './scripts/index.js',
  output: {
    filename: fileName('scripts', 'js'),
    path: path.resolve(__dirname, 'build'),
  },
  // resolve: {
  //   extensions: ['.js'],
  //   alias: {
  //     '@': path.resolve(__dirname, 'src'),
  //     '@img': path.resolve(__dirname, 'src/img'),
  //   },
  // },
  optimization: optimization(),
  devtool: isDev ? 'source-map' : false,
  devServer: {
    port: 3000,
    hot: isDev,
  },
  plugins: plugins(),
  module: {
    rules: [
      {
        test: /\.s[ac]ss$/,
        // include: 'src/scss',
        use: cssLoaders(),
      },
      {
        test: /\.(png|jpg|svg|gif)$/,
        use: ['file-loader'],
      },
      {
        test: /\.(ttf|woff|woff2|eot)$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: '[path][name].[ext]',
            },
          },
        ],
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: jsLoaders(),
      },
    ],
  },
};

