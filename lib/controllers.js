'use strict';

const path = require('path');

const parent = module.parent.exports;
const postsAPI = nodebb.require('./src/api/posts');
const file = nodebb.require('./src/file');
const { paths } = nodebb.require('./src/constants');

const Controllers = module.exports;

Controllers.renderAdmin = async function renderAdmin(req, res) {
	let hljsLanguages = await file.walk(
		path.resolve(paths.nodeModules, 'highlight.js/lib/languages')
	);
	hljsLanguages = hljsLanguages.map(language => path.basename(language, '.js')).filter(language => !language.endsWith('.js'));

	res.render('admin/plugins/markdown', {
		themes: parent.themes,
		hljsLanguages,
		title: 'Markdown',
	});
};

Controllers.retrieveRaw = async function (req, res, next) {
	const pid = parseInt(req.params.pid, 10);
	if (!pid) {
		return next();
	}
	const content = await postsAPI.getRawPost({ uid: req.uid }, { pid });
	if (content === null) {
		return next();
	}
	res.json({ pid, content });
};
