//@ts-check

'use strict';

const path = require('path');

const TerserPlugin = require('terser-webpack-plugin');
const CompressionPlugin = require('compression-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const { webpack, DefinePlugin } = require('webpack');

//@ts-check
/** @typedef {import('webpack').Configuration} WebpackConfig **/

module.exports = (env) => {
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
            new CleanWebpackPlugin(),
            new CompressionPlugin({
                algorithm: 'gzip',
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
