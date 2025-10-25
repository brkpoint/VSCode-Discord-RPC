//@ts-check

'use strict';

const path = require('path');

const TerserPlugin = require('terser-webpack-plugin');
const { TsconfigPathsPlugin } = require('tsconfig-paths-webpack-plugin');
const CompressionPlugin = require('compression-webpack-plugin');
const BundleAnalyzerPlugin =
    require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const { DefinePlugin } = require('webpack');

//@ts-check
/** @typedef {import('webpack').Configuration} WebpackConfig **/

//@ts-ignore
module.exports = (env, argv) => {
    // Development mode flag
    const mode = argv.mode || 'production';

    const isDev = mode === 'development' || false;

    const extensions = ['.ts', '.js'];

    const srcPath = path.resolve(__dirname, 'src');
    const entryPath = path.resolve(__dirname, 'src', 'main.ts');
    const outputPath = path.resolve(__dirname, 'dist');
    const testPath = path.resolve(__dirname, 'test');

    const devtool = isDev ? 'eval-source-map' : 'none';

    // Plugins
    let plugins = [
        new CleanWebpackPlugin(),
        new DefinePlugin({
            'process.env.NODE_ENV': JSON.stringify(mode),
        }),
    ];

    const resolvePlugins = [new TsconfigPathsPlugin()];

    if (isDev) {
        //@ts-ignore
        plugins.push(new BundleAnalyzerPlugin());
    }

    console.log(`Building for ${mode}...`);
    console.log(`Entry: ${entryPath}`);
    console.log(`Output: ${outputPath}`);
    console.log(`Source Maps: ${devtool}`);

    // Webpack configuration
    return {
        mode: mode,
        target: 'node',
        entry: entryPath,
        output: {
            path: outputPath,
            filename: '[name].js',
            libraryTarget: 'commonjs2',
            clean: true,
        },
        externals: {
            vscode: 'commonjs vscode',
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
                    exclude: [testPath],
                },
                {
                    test: /\.js$/,
                    exclude: [testPath],
                },
            ],
        },
        resolve: {
            extensions: extensions,
            plugins: resolvePlugins,
        },
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
        plugins: plugins,
        devtool: devtool,
        infrastructureLogging: {
            level: 'log',
        },
    };
};
