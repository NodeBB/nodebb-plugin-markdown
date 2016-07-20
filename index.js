(function() {
	"use strict";

	var	MarkdownIt = require('markdown-it'),
		fs = require('fs'),
		path = require('path'),
		url = require('url');

	var	meta = module.parent.require('./meta'),
		nconf = module.parent.require('nconf'),
		translator = module.parent.require('../public/src/modules/translator'),
		plugins = module.parent.exports;

	var	parser,
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

				Markdown.init();
				Markdown.loadThemes();

				callback();
			},

			getConfig: function(config, callback) {
				config.markdown = {
					highlight: Markdown.highlight ? 1 : 0,
					theme: Markdown.config.highlightTheme || 'railscasts.css'
				};
				callback(null, config);
			},

			getLinkTags: function(links, callback) {
				links.push({
					rel: "stylesheet",
					type: "",
					href: nconf.get('relative_path') + '/plugins/nodebb-plugin-markdown/styles/' + (Markdown.config.highlightTheme || 'railscasts.css')
				});
				callback(null, links);
			},

			init: function() {
				// Load saved config
				var	_self = this,
					fields = [
						'html', 'xhtmlOut', 'breaks', 'langPrefix', 'linkify', 'typographer', 'externalBlank', 'nofollow'
					],
					defaults = {
						'html': false,
						'xhtmlOut': true,
						'breaks': true,
						'langPrefix': 'language-',
						'linkify': true,
						'typographer': false,
						'highlight': true,
						'highlightTheme': 'railscasts.css',
						'externalBlank': false,
						'nofollow': true
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

					_self.highlight = _self.config.highlight;
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
				if (data && data.postData && data.postData.content && parser) {
					data.postData.content = parser.render(data.postData.content);
				}
				callback(null, data);
			},

			parseSignature: function(data, callback) {
				if (data && data.userData && data.userData.signature && parser) {
					data.userData.signature = parser.render(data.userData.signature);
				}
				callback(null, data);
			},

			parseAboutMe: function(aboutme, callback) {
				callback(null, (aboutme && parser) ? parser.render(aboutme) : aboutme);
			},

			parseRaw: function(raw, callback) {
				callback(null, (raw && parser) ? parser.render(raw) : raw);
			},
			renderHelp: function(helpContent, callback) {
				translator.translate('[[markdown:help_text]]', function(translated) {
					plugins.fireHook('filter:parse.raw', '## Markdown\n' + translated, function(err, parsed) {
						helpContent += parsed;
						callback(null, helpContent);
					});
				});
			},

			registerFormatting: function(payload, callback) {
				var formatting = [
					{name: 'bold', className: 'fa fa-bold', title: '[[modules:composer.formatting.bold]]'},
					{name: 'italic', className: 'fa fa-italic', title: '[[modules:composer.formatting.italic]]'},
					{name: 'list', className: 'fa fa-list', title: '[[modules:composer.formatting.list]]'},
					{name: 'strikethrough', className: 'fa fa-strikethrough', title: '[[modules:composer.formatting.strikethrough]]'},
					{name: 'link', className: 'fa fa-link', title: '[[modules:composer.formatting.link]]'},
					{name: 'picture-o', className: 'fa fa-picture-o', title: '[[modules:composer.formatting.picture]]'}
				];

				payload.options = formatting.concat(payload.options);

				callback(null, payload);
			},

			updateParserRules: function(parser) {
				// Update renderer to add some classes to all images
				var renderImage = parser.renderer.rules.image || function(tokens, idx, options, env, self) {
						return self.renderToken.apply(self, arguments);
					},
					renderLink = parser.renderer.rules.link_open || function(tokens, idx, options, env, self) {
						return self.renderToken.apply(self, arguments);
					},
					renderTable = parser.renderer.rules.table_open || function(tokens, idx, options, env, self) {
						return self.renderToken.apply(self, arguments);
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

				parser.renderer.rules.link_open = function(tokens, idx, options, env, self) {
					// Add target="_blank" to all links
					var targetIdx = tokens[idx].attrIndex('target'),
						relIdx = tokens[idx].attrIndex('rel'),
						hrefIdx = tokens[idx].attrIndex('href');

					if (Markdown.isExternalLink(tokens[idx].attrs[hrefIdx][1])) {
						if (Markdown.config.externalBlank) {
							if (targetIdx < 0) {
								tokens[idx].attrPush(['target', '_blank']);
							} else {
								tokens[idx].attrs[targetIdx][1] = '_blank';
							}
						}

						if (Markdown.config.nofollow) {
							if (relIdx < 0) {
								tokens[idx].attrPush(['rel', 'nofollow']);
							} else {
								tokens[idx].attrs[relIdx][1] = 'nofollow';
							}
						}
					}

					return renderLink(tokens, idx, options, env, self);
				};

				parser.renderer.rules.table_open = function(tokens, idx, options, env, self) {
					var classIdx = tokens[idx].attrIndex('class');

					if (classIdx < 0) {
						tokens[idx].attrPush(['class', 'table table-bordered table-striped']);
					} else {
						tokens[idx].attrs[classIdx][1] = tokens[idx].attrs[classIdx][1] + ' table table-bordered table-striped';
					}

					return renderTable(tokens, idx, options, env, self);
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

			isExternalLink: function(urlString) {
				var urlObj = url.parse(urlString),
					baseUrlObj = url.parse(nconf.get('url'));

				if (
					urlObj.host === null ||	// Relative paths are always internal links...
					(urlObj.host === baseUrlObj.host && urlObj.protocol === baseUrlObj.protocol &&	// Otherwise need to check that protocol and host match
					(nconf.get('relative_path').length > 0 ? urlObj.pathname.indexOf(nconf.get('relative_path')) === 0 : true))	// Subfolder installs need this additional check
				) {
					return false;
				} else {
					return true;
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

