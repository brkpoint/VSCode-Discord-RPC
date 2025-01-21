//@ts-check

'use strict';

const path = require('path');

const TerserPlugin = require('terser-webpack-plugin');
const CompressionPlugin = require('compression-webpack-plugin');
const Dotenv = require('dotenv-webpack');
const { webpack, DefinePlugin } = require('webpack');

//@ts-check
/** @typedef {import('webpack').Configuration} WebpackConfig **/

module.exports = (env) => {
    const isProduction = env.NODE_ENV === 'production';
    const dotenvFilename = isProduction
        ? '.env.production'
        : '.env.development';

    const extensionConfig = {
        target: 'node',
        entry: './src/extension.main.ts',
        output: {
            path: path.resolve(__dirname, 'dist'),
            filename: 'extension.js',
            libraryTarget: 'commonjs2',
        },
        externals: {
            vscode: 'commonjs vscode',
        },
        resolve: {
            extensions: ['.ts', '.js'],
        },
        module: {
            rules: [
                {
                    test: /\.ts$/,
                    exclude: /node_modules/,
                    use: [
                        {
                            loader: 'ts-loader',
                        },
                    ],
                },
                {
                    test: /\.ts$/,
                    exclude: [path.resolve(__dirname, 'test')],
                },
                {
                    test: /\.js$/,
                    exclude: [path.resolve(__dirname, 'test')],
                },
            ],
        },
        devtool: 'nosources-source-map',
        infrastructureLogging: {
            level: 'log',
        },
        plugins: [
            new CompressionPlugin({
                algorithm: 'gzip',
            }),
            new Dotenv({
                path: dotenvFilename,
            }),
            new DefinePlugin({
                'process.env.NODE_ENV': JSON.stringify(env.NODE_ENV),
            }),
        ],
        optimization: {
            splitChunks: {
                chunks: 'all',
            },
            minimize: true,
            minimizer: [new TerserPlugin()],
            concatenateModules: true,
            usedExports: true,
        },
    };

    return extensionConfig;
};
