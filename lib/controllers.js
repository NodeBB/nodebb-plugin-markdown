'use strict';

const parent = module.parent.exports;
const posts = require.main.require('./src/posts');
const Controllers = {};

Controllers.renderAdmin = function renderAdmin(req, res) {
	res.render('admin/plugins/markdown', {
		themes: parent.themes,
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
