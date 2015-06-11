(function() {
	"use strict";

	var	MarkdownIt = require('markdown-it'),
		fs = require('fs'),
		path = require('path'),
		url = require('url'),
		meta = module.parent.require('./meta'),
		nconf = module.parent.require('nconf'),
		plugins = module.parent.exports,
		parser,
		Markdown = {
			config: {},
			onLoad: function(params, callback) {
				function render(req, res, next) {
					res.render('admin/plugins/markdown', {
						themes: Markdown.themes
					});
				}

				params.router.get('/admin/plugins/markdown', params.middleware.admin.buildHeader, render);
				params.router.get('/api/admin/plugins/markdown', render);
				params.router.get('/markdown/config', function(req, res) {
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

					parser = new MarkdownIt(_self.config);

					Markdown.updateParserRules(parser);
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

			parsePost: function(data, callback) {
				if (data && data.postData && data.postData.content) {
					data.postData.content = parser.render(data.postData.content);
				}
				callback(null, data);
			},

			parseSignature: function(data, callback) {
				if (data && data.userData && data.userData.signature) {
					data.userData.signature = parser.render(data.userData.signature);
				}
				callback(null, data);
			},

			parseRaw: function(raw, callback) {
				callback(null, raw ? parser.render(raw) : raw);
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
				plugins.fireHook('filter:parse.raw', '## Markdown\nThis forum is powered by Markdown. For full documentation, [click here](http://daringfireball.net/projects/markdown/syntax)', function(err, parsed) {
					helpContent += parsed;
					callback(null, helpContent);
				});
			},

			registerFormatting: function(payload, callback) {
				var formatting = ['bold', 'italic', 'list', 'link'];

				formatting.reverse();
				formatting.forEach(function(format) {
					payload.options.unshift({ name: format, className: 'fa fa-' + format });
				});

				callback(null, payload);
			},

			updateParserRules: function(parser) {
				// Update renderer to add some classes to all images
				var renderImage = parser.renderer.rules.image || function(tokens, idx, options, env, self) {
						renderToken.apply(self, arguments);
					};

				parser.renderer.rules.image = function (tokens, idx, options, env, self) {
					var classIdx = tokens[idx].attrIndex('class'),
						srcIdx = tokens[idx].attrIndex('src');

					// Validate the url
					if (!Markdown.isUrlValid(tokens[idx].attrs[srcIdx][1])) { return ''; }

					if (classIdx < 0) {
						tokens[idx].attrPush(['class', 'img-responsive img-markdown']);
					} else {
						tokens[idx].attrs[classIdx][1] = tokens[idx].attrs[classIdx][1] + ' img-responsive img-markdown';
					}

					return renderImage(tokens, idx, options, env, self);
				};

				plugins.fireHook('action:markdown.updateParserRules', parser);
			},

			isUrlValid: function(src) {
				try {
					var urlObj = url.parse(src, false, true);
					if (urlObj.host === null && !urlObj.pathname.toString().startsWith(nconf.get('relative_path') + nconf.get('upload_url'))) {
						return false;
					} else {
						return true;
					}
				} catch (e) {
					return false;
				}

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

