var	marked = require('marked'),
	hljs = require('highlight.js'),
	fs = require('fs'),
	path = require('path'),
	Markdown = {
		admin: {
			menu: function(custom_header, callback) {
				custom_header.plugins.push({
					"route": '/plugins/markdown',
					"icon": 'icon-edit',
					"name": 'Markdown'
				});

				return custom_header;
			},
			route: function(custom_routes, callback) {
				fs.readFile(path.join(__dirname, 'public/templates/admin.tpl'), function(err, tpl) {
					custom_routes.routes.push({
						route: '/plugins/markdown',
						method: "get",
						options: function(req, res, callback) {
							callback({
								req: req,
								res: res,
								route: '/plugins/markdown',
								name: Markdown,
								content: tpl
							});
						}
					});

					callback(null, custom_routes);
				});
			}
		},
		markdownify: function(raw) {
			return marked(raw);
		}
	};

marked.setOptions({
	breaks: true,
	sanitize: true,
	highlight: function (code, lang) {
		return hljs.highlightAuto(code).value;
	}
});

module.exports = Markdown;