//@ts-check

'use strict';

const path = require('path');

const TerserPlugin = require('terser-webpack-plugin');
const CompressionPlugin = require('compression-webpack-plugin');
const BundleAnalyzerPlugin =
    require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const { DefinePlugin } = require('webpack');

//@ts-check
/** @typedef {import('webpack').Configuration} WebpackConfig **/

const plugins = [
    new CleanWebpackPlugin(),
    new DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
    }),
];

if (process.env.NODE_ENV === 'development') {
    //@ts-ignore
    plugins.push(new BundleAnalyzerPlugin());
}

module.exports = {
    target: 'node',
    mode: 'none',
    entry: './src/extension.main.ts',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].js',
        libraryTarget: 'commonjs2',
        clean: true,
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
    plugins: plugins,
    optimization: {
        splitChunks: {
            cacheGroups: {
                vendors: false,
            },
            chunks: 'all',
        },
        minimize: true,
        minimizer: [new TerserPlugin()],
        concatenateModules: true,
        usedExports: true,
    },
};
