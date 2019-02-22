'use strict';

const path = require('path');

module.exports = {
	mode: 'production',
	entry: {
		highlight: './public/js/highlight.js',
		'highlightjs-line-numbers': './node_modules/highlightjs-line-numbers.js/src/highlightjs-line-numbers.js',
	},
	output: {
		path: path.resolve(__dirname, 'dist'),
		filename: '[name].js',
		library: '[name]',
		libraryTarget: 'amd',
	},
};
