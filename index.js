var	marked = require('marked'),
	pygmentize = require('pygmentize-bundled'),
	fs = require('fs'),
	path = require('path'),
	async = require('async'),
 	meta = module.parent.require('./meta'),
	Markdown = {
		config: {},
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
							
							if(result) {
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
		admin: {
			menu: function(custom_header, callback) {
				custom_header.plugins.push({
					"route": '/plugins/markdown',
					"icon": 'fa-edit',
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
