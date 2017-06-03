const prod = process.argv.indexOf('-p') !== -1;
const webpack = require('webpack');

module.exports = {
  entry: './src/index.js',
  output: {
    path: __dirname + '/dist',
    filename: 'bundle.js'
  },
  plugins: [
    new webpack.DefinePlugin({
     'process.env.MAP_KEY': JSON.stringify(process.env.MAP_KEY || 'development')
    })
  ],
  module: {
    loaders:[
      { test:/\.js$/,
        exclude: /node_module/,
        loader: 'babel-loader',
        query: {presets: ['es2015', 'react']}
      },
	  {
		test: /\.json$/,
		loaders: 'json'  
	  }
    ]
  },
  devtool: 'sourcemap'
}


