var	marked = require('marked'),
	pygmentize = require('pygmentize-bundled'),
	fs = require('fs'),
	path = require('path'),
	async = require('async'),
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
				},
				hashes = fields.map(function(field) { return 'nodebb-plugin-markdown:options:' + field });

			meta.configs.getFields(hashes, function(err, options) {
				var	option;
				for(field in options) {
					if (options.hasOwnProperty(field)) {
						option = field.slice(31);

						// If not set in config (nil)
						if (!options[field]) {
							_self.config[option] = defaults[option];
						} else {
							if (option !== 'langPrefix') {
								_self.config[option] = options[field] === '1' ? true : false;
							} else {
								_self.config[option] = options[field];
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
		reload: function(hookVals) {
			var	isMarkdownPlugin = /^nodebb-plugin-markdown/;
			if (isMarkdownPlugin.test(hookVals.key)) {
				this.init();
			}
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

				return custom_header;
			},
			activate: function(id) {
				if (id === 'nodebb-plugin-markdown') {
					var defaults = [
						{ field: 'gfm', value: '1' },
						{ field: 'highlight', value: '1' },
						{ field: 'tables', value: '1' },
						{ field: 'breaks', value: '1' },
						{ field: 'pedantic', value: '0' },
						{ field: 'sanitize', value: '1' },
						{ field: 'smartLists', value: '1' },
						{ field: 'smartypants', value: '0' },
						{ field: 'langPrefix', value: 'lang-' }
					];

					async.each(defaults, function(optObj, next) {
						meta.configs.setOnEmpty('nodebb-plugin-markdown:options:' + optObj.field, optObj.value, next);
					});
				}
			}
		}
	};

Markdown.init();
module.exports = Markdown;
