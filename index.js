(function() {
	"use strict";

	var	marked = require('marked'),
		fs = require('fs'),
		path = require('path'),
		async = module.parent.require('async'),
		meta = module.parent.require('./meta'),

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
						theme: Markdown.config.highlightTheme || 'codepen-embed.css'
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
						'gfm', 'highlight', 'tables', 'breaks', 'pedantic',
						'sanitize', 'smartLists', 'smartypants', 'langPrefix', 'headerPrefix'
					],
					defaults = {
						'gfm': true,
						'highlight': true,
						'tables': true,
						'breaks': true,
						'pedantic': false,
						'sanitize': true,
						'smartLists': true,
						'smartypants': false,
						'langPrefix': 'lang-',
						'headerPrefix': 'md-header-'
					};

				meta.settings.get('markdown', function(err, options) {
					for(var field in options) {
						if (options.hasOwnProperty(field)) {
							// If not set in config (nil)
							if (!options[field]) {
								_self.config[field] = defaults[field];
							} else {
								if (field !== 'langPrefix' && field !== 'highlightTheme' && field !== 'headerPrefix') {
									_self.config[field] = options[field] === 'on' ? true : false;
								} else {
									_self.config[field] = options[field];
								}
							}
						}
					}

					_self.highlight = _self.config.highlight;
					delete _self.config.highlight;

					marked.setOptions(_self.config);
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
				return marked(raw, callback);
			},
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
				},
				activate: function(id) {
					if (id === 'nodebb-plugin-markdown') {
						var defaults = [
							{ field: 'gfm', value: 'on' },
							{ field: 'highlight', value: 'on' },
							{ field: 'tables', value: 'on' },
							{ field: 'breaks', value: 'on' },
							{ field: 'pedantic', value: 'off' },
							{ field: 'sanitize', value: 'on' },
							{ field: 'smartLists', value: 'on' },
							{ field: 'smartypants', value: 'off' },
							{ field: 'langPrefix', value: 'lang-' },
							{ field: 'headerPrefix', value: 'md-header-'}
						];

						async.each(defaults, function(optObj, next) {
							meta.settings.setOnEmpty('markdown', optObj.field, optObj.value, next);
						});
					}
				}
			}
		};

	module.exports = Markdown;
})();
