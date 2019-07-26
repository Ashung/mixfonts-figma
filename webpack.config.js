const HtmlWebpackInlineSourcePlugin = require('html-webpack-inline-source-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const path = require('path')

module.exports = (env, argv) => ({

    devtool: argv.mode === 'production' ? false : 'inline-source-map',

    entry: {
        ui: './src/ui.js',
        code: './src/code.js'
    },

    module: {
        rules: [
            // Converts TypeScript code to JavaScript
            // {
            //     test: /\.tsx?$/,
            //     use: 'ts-loader',
            //     exclude: /node_modules/
            // },

            // Enables including CSS by doing "import './file.css'" in your TypeScript code
            {
                test: /\.scss$/,
                use: [ 'style-loader', 'css-loader', 'sass-loader' ]
            },

            // {
            //     test: /\.scripts\.min\.js$/,
            //     use: [ 'script-loader' ]
            // },

            // Allows you to use "<%= require('./file.svg') %>" in your HTML code to get a data URI
            {
                test: /\.(png|jpg|gif|webp|svg)$/,
                use: 'url-loader'
            },
        ],
    },

    resolve: {
        extensions: [ '.js' ],
        alias: { vue: 'vue/dist/vue.esm.browser.min.js' }
    },

    output: {
        filename: '[name].js',
        path: path.resolve(__dirname, 'dist'),
    },

    // Tells Webpack to generate "ui.html" and to inline "ui.ts" into it
    plugins: [
        new HtmlWebpackPlugin({
            template: './src/ui.html',
            filename: 'ui.html',
            inlineSource: '.(js)$',
            chunks: ['ui'],
        }),
        new HtmlWebpackInlineSourcePlugin(),
    ],
})