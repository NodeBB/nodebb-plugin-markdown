'use strict';

const path = require('path');

const parent = module.parent.exports;
const posts = require.main.require('./src/posts');
const file = require.main.require('./src/file');
const Controllers = {};

Controllers.renderAdmin = async function renderAdmin(req, res) {
	let hljsLanguages = await file.walk(path.resolve(require.main.path, 'node_modules/highlight.js/lib/languages'));
	hljsLanguages = hljsLanguages.map(language => path.basename(language, '.js')).filter(language => !language.endsWith('.js'));

	res.render('admin/plugins/markdown', {
		themes: parent.themes,
		hljsLanguages,
		title: 'Markdown',
	});
};

Controllers.retrieveRaw = function retrieveRaw(req, res, next) {
	const pid = parseInt(req.params.pid, 10);

	if (!pid) {
		return next();
	}

	posts.getPostField(pid, 'content', (err, content) => {
		if (err) {
			return next(err);
		}

		res.json({
			pid: pid,
			content: content,
		});
	});
};

module.exports = Controllers;
