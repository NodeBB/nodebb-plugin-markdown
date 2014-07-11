var	marked = require('marked'),
	pygmentize = require('pygmentize-bundled'),
	fs = require('fs'),
	path = require('path'),
	async = module.parent.require('async'),
 	meta = module.parent.require('./meta'),
	Markdown = {
		config: {},
		onLoad: function(app, middleware, controllers) {
			function render(req, res, next) {
				res.render('admin/plugins/markdown', {});
			}

			app.get('/admin/plugins/markdown', middleware.admin.buildHeader, render);
			app.get('/api/admin/plugins/markdown', render);
		},
		init: function() {
			// Load saved config
			var	_self = this,
				fields = [
					'gfm', 'highlight', 'tables', 'breaks', 'pedantic',
					'sanitize', 'smartLists', 'smartypants', 'langPrefix'
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
					'langPrefix': 'lang-'
				};

			meta.settings.get('markdown', function(err, options) {
				for(var field in options) {
					if (options.hasOwnProperty(field)) {
						// If not set in config (nil)
						if (!options[field]) {
							_self.config[field] = defaults[field];
						} else {
							if (field !== 'langPrefix') {
								_self.config[field] = options[field] === 'on' ? true : false;
							} else {
								_self.config[field] = options[field];
							}
						}
					}
				}

				// Enable highlighting
				if (_self.config.highlight) {
					_self.config.highlight = function (code, lang, callback) {
						pygmentize({
							lang: lang,
							format: 'html',
							options: {
								nowrap: 'true'
							}
						}, code, function (err, result) {
							if(err) {
								return callback(err);
							}

							if (result) {
								return callback(null, result.toString());
							}
							callback(null, code);
						});
					};
				}

				marked.setOptions(_self.config);
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
						{ field: 'langPrefix', value: 'lang-' }
					];

					async.each(defaults, function(optObj, next) {
						meta.settings.setOnEmpty('markdown', optObj.field, optObj.value, next);
					});
				}
			}
		}
	};

Markdown.init();
module.exports = Markdown;
