(function() {
	"use strict";

	var	Remarkable = require('remarkable'),
		fs = require('fs'),
		path = require('path'),
		url = require('url'),
		async = module.parent.require('async'),
		meta = module.parent.require('./meta'),
		nconf = module.parent.require('nconf'),
		parser,

		Markdown = {
			config: {},
			onLoad: function(app, middleware, controllers, callback) {
				function render(req, res, next) {
					res.render('admin/plugins/markdown', {
						themes: Markdown.themes
					});
				}

				app.get('/admin/plugins/markdown', middleware.admin.buildHeader, render);
				app.get('/api/admin/plugins/markdown', render);
				app.get('/markdown/config', function(req, res) {
					res.status(200).json({
						highlight: Markdown.highlight ? 1 : 0,
						theme: Markdown.config.highlightTheme || 'railscasts.css'
					});
				});

				Markdown.init();
				Markdown.loadThemes();
				callback();
			},
			init: function() {
				// Load saved config
				var	_self = this,
					fields = [
						'html', 'xhtmlOut', 'breaks', 'langPrefix', 'linkify', 'typographer'
					],
					defaults = {
						'html': false,
						'xhtmlOut': true,
						'breaks': true,
						'langPrefix': 'language-',
						'linkify': true,
						'typographer': false,
						'highlight': true,
						'highlightTheme': 'railscasts.css'
					};

				meta.settings.get('markdown', function(err, options) {
					for(var field in defaults) {
						// If not set in config (nil)
						if (!options.hasOwnProperty(field)) {
							_self.config[field] = defaults[field];
						} else {
							if (field !== 'langPrefix' && field !== 'highlightTheme' && field !== 'headerPrefix') {
								_self.config[field] = options[field] === 'on' ? true : false;
							} else {
								_self.config[field] = options[field];
							}
						}
					}

					_self.highlight = _self.config.highlight || true;
					delete _self.config.highlight;

					parser = new Remarkable(_self.config);
				});
			},
			loadThemes: function() {
				fs.readdir(path.join(__dirname, 'public/styles'), function(err, files) {
					var isStylesheet = /\.css$/;
					Markdown.themes = files.filter(function(file) {
						return isStylesheet.test(file);
					}).map(function(file) {
						return {
							name: file
						}
					});
				});
			},
			markdownify: function(raw, callback) {
				callback(undefined, parser.render(raw));
			},
			// addNofollow: function(html) {
			// 	if (Markdown.config.noFollow) {
			// 		var parsed,
			// 			baseHost = url.parse(nconf.get('base_url')).host;

			// 		html = html.replace(/<a href="([^"]+)/g, function(match, anchorUrl) {
			// 			parsed = url.parse(anchorUrl, false, true);
			// 			if (parsed.host !== null && baseHost !== parsed.host) {
			// 				return '<a rel="nofollow" href="' + anchorUrl;
			// 			} else {
			// 				return match;
			// 			}
			// 		});
			// 		return html;
			// 	} else {
			// 		return html;
			// 	}
			// },
			renderHelp: function(helpContent, callback) {
				helpContent += "<h2>Markdown</h2><p>This forum is powered by Markdown. For full documentation, <a href=\"http://daringfireball.net/projects/markdown/syntax\">click here</a></p>";
				callback(null, helpContent);
			},
			admin: {
				menu: function(custom_header, callback) {
					custom_header.plugins.push({
						"route": '/plugins/markdown',
						"icon": 'fa-edit',
						"name": 'Markdown'
					});

					callback(null, custom_header);
				}
			}
		};

	module.exports = Markdown;
})();
