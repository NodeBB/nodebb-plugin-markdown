'use strict';

var MarkdownIt = require('markdown-it');
var fs = require('fs');
var path = require('path');
var url = require('url');
var async = require('async');

var meta = require.main.require('./src/meta');
var translator = require.main.require('./public/src/modules/translator');
var nconf = require.main.require('nconf');
var winston = require.main.require('winston');
var plugins = module.parent.exports;

var SocketPlugins = require.main.require('./src/socket.io/plugins');
SocketPlugins.markdown = require('./websockets');

var	parser;

var Markdown = {
	config: {},
	onLoad: function (params, callback) {
		const controllers = require('./lib/controllers');
		const hostMiddleware = require.main.require('./src/middleware');
		const middlewares = [hostMiddleware.maintenanceMode, hostMiddleware.registrationComplete, hostMiddleware.pluginHooks];

		params.router.get('/admin/plugins/markdown', params.middleware.admin.buildHeader, controllers.renderAdmin);
		params.router.get('/api/admin/plugins/markdown', controllers.renderAdmin);

		// Return raw markdown via GET
		params.router.get('/api/post/:pid/raw', middlewares, controllers.retrieveRaw);

		Markdown.init();
		Markdown.loadThemes();

		callback();
	},

	getConfig: function (config, callback) {
		config.markdown = {
			highlight: Markdown.highlight ? 1 : 0,
			highlightLinesLanguageList: Markdown.config.highlightLinesLanguageList,
			theme: Markdown.config.highlightTheme || 'railscasts.css',
		};
		callback(null, config);
	},

	getLinkTags: function (hookData, callback) {
		hookData.links.push({
			rel: 'prefetch stylesheet',
			type: '',
			href: nconf.get('relative_path') + '/plugins/nodebb-plugin-markdown/styles/' + (Markdown.config.highlightTheme || 'railscasts.css'),
		});

		var prefetch = ['/assets/src/modules/highlight.js', '/assets/language/' + (meta.config.defaultLang || 'en-GB') + '/markdown.json'];
		hookData.links = hookData.links.concat(prefetch.map(function (path) {
			path = {
				rel: 'prefetch',
				href: nconf.get('relative_path') + path + '?' + meta.config['cache-buster'],
			};
			return path;
		}));

		callback(null, hookData);
	},

	init: function () {
		// Load saved config
		var	_self = this;
		var defaults = {
			html: false,
			xhtmlOut: true,
			breaks: true,
			langPrefix: 'language-',
			linkify: true,
			typographer: false,
			highlight: true,
			highlightLinesLanguageList: [],
			highlightTheme: 'railscasts.css',
			externalBlank: false,
			nofollow: true,
			allowRTLO: false,
		};

		meta.settings.get('markdown', function (err, options) {
			if (err) {
				winston.warn('[plugin/markdown] Unable to retrieve settings, assuming defaults: ' + err.message);
			}

			for (var field in defaults) {
				// If not set in config (nil)
				if (!options.hasOwnProperty(field)) {
					_self.config[field] = defaults[field];
				} else if (field !== 'langPrefix' && field !== 'highlightTheme' && field !== 'headerPrefix' && field !== 'highlightLinesLanguageList') {
					_self.config[field] = options[field] === 'on';
				} else {
					_self.config[field] = options[field];
				}
			}

			_self.highlight = _self.config.highlight;
			delete _self.config.highlight;

			if (typeof _self.config.highlightLinesLanguageList === 'string') {
				try {
					_self.config.highlightLinesLanguageList = JSON.parse(_self.config.highlightLinesLanguageList);
				} catch (e) {
					winston.warn('[plugins/markdown] Invalid config for highlightLinesLanguageList, blanking.');
					_self.config.highlightLinesLanguageList = [];
				}

				_self.config.highlightLinesLanguageList = _self.config.highlightLinesLanguageList.join(',').split(',');
			}

			parser = new MarkdownIt(_self.config);

			Markdown.updateParserRules(parser);
		});
	},

	loadThemes: function () {
		fs.readdir(path.join(require.resolve('highlight.js'), '../../styles'), function (err, files) {
			if (err) {
				winston.error('[plugin/markdown] Could not load Markdown themes: ' + err.message);
				Markdown.themes = [];
				return;
			}
			var isStylesheet = /\.css$/;
			Markdown.themes = files.filter(function (file) {
				return isStylesheet.test(file);
			}).map(function (file) {
				return {
					name: file,
				};
			});
		});
	},

	parsePost: function (data, callback) {
		async.waterfall([
			function (next) {
				if (data && data.postData && data.postData.content && parser) {
					data.postData.content = parser.render(data.postData.content);
				}
				next(null, data);
			},
			async.apply(Markdown.postParse),
		], callback);
	},

	parseSignature: function (data, callback) {
		async.waterfall([
			function (next) {
				if (data && data.userData && data.userData.signature && parser) {
					data.userData.signature = parser.render(data.userData.signature);
				}
				next(null, data);
			},
			async.apply(Markdown.postParse),
		], callback);
	},

	parseAboutMe: function (aboutme, callback) {
		async.waterfall([
			function (next) {
				aboutme = (aboutme && parser) ? parser.render(aboutme) : aboutme;
				process.nextTick(next, null, aboutme);
			},
			async.apply(Markdown.postParse),
		], callback);
	},

	parseRaw: function (raw, callback) {
		async.waterfall([
			function (next) {
				raw = (raw && parser) ? parser.render(raw) : raw;
				process.nextTick(next, null, raw);
			},
			async.apply(Markdown.postParse),
		], callback);
	},

	postParse: function (payload, next) {
		var italicMention = /@<em>([^<]+)<\/em>/g;
		var execute = function (html) {
			// Replace all italicised mentions back to regular mentions
			if (italicMention.test(html)) {
				html = html.replace(italicMention, function (match, slug) {
					return '@_' + slug + '_';
				});
			}

			return html;
		};

		if (payload) {
			if (payload.hasOwnProperty('postData')) {
				payload.postData.content = execute(payload.postData.content);
			} else if (payload.hasOwnProperty('userData')) {
				payload.userData.signature = execute(payload.userData.signature);
			} else {
				payload = execute(payload);
			}
		}

		next(null, payload);
	},

	renderHelp: function (helpContent, callback) {
		translator.translate('[[markdown:help_text]]', function (translated) {
			plugins.fireHook('filter:parse.raw', '## Markdown\n' + translated, function (err, parsed) {
				if (err) {
					return callback(err);
				}

				helpContent += parsed;
				callback(null, helpContent);
			});
		});
	},

	registerFormatting: function (payload, callback) {
		var formatting = [
			{ name: 'bold', className: 'fa fa-bold', title: '[[modules:composer.formatting.bold]]' },
			{ name: 'italic', className: 'fa fa-italic', title: '[[modules:composer.formatting.italic]]' },
			{ name: 'list', className: 'fa fa-list', title: '[[modules:composer.formatting.list]]' },
			{ name: 'strikethrough', className: 'fa fa-strikethrough', title: '[[modules:composer.formatting.strikethrough]]' },
			{ name: 'code', className: 'fa fa-code', title: '[[modules:composer.formatting.code]]' },
			{ name: 'link', className: 'fa fa-link', title: '[[modules:composer.formatting.link]]' },
			{ name: 'picture-o', className: 'fa fa-picture-o', title: '[[modules:composer.formatting.picture]]' },
		];

		payload.options = formatting.concat(payload.options);

		callback(null, payload);
	},

	updateParserRules: function (parser) {
		// Add support for checkboxes
		parser.use(require('markdown-it-checkbox'), {
			divWrap: true,
			divClass: 'plugin-markdown',
		});

		// Update renderer to add some classes to all images
		var renderImage = parser.renderer.rules.image || function (tokens, idx, options, env, self) {
			return self.renderToken.apply(self, arguments);
		};
		var renderLink = parser.renderer.rules.link_open || function (tokens, idx, options, env, self) {
			return self.renderToken.apply(self, arguments);
		};
		var renderTable = parser.renderer.rules.table_open || function (tokens, idx, options, env, self) {
			return self.renderToken.apply(self, arguments);
		};

		parser.renderer.rules.image = function (tokens, idx, options, env, self) {
			var classIdx = tokens[idx].attrIndex('class');
			var srcIdx = tokens[idx].attrIndex('src');

			// Validate the url
			if (!Markdown.isUrlValid(tokens[idx].attrs[srcIdx][1])) { return ''; }

			if (classIdx < 0) {
				tokens[idx].attrPush(['class', 'img-responsive img-markdown']);
			} else {
				tokens[idx].attrs[classIdx][1] += ' img-responsive img-markdown';
			}

			return renderImage(tokens, idx, options, env, self);
		};

		parser.renderer.rules.link_open = function (tokens, idx, options, env, self) {
			// Add target="_blank" to all links
			var targetIdx = tokens[idx].attrIndex('target');
			var relIdx = tokens[idx].attrIndex('rel');
			var hrefIdx = tokens[idx].attrIndex('href');

			if (Markdown.isExternalLink(tokens[idx].attrs[hrefIdx][1])) {
				if (Markdown.config.externalBlank) {
					if (targetIdx < 0) {
						tokens[idx].attrPush(['target', '_blank']);
					} else {
						tokens[idx].attrs[targetIdx][1] = '_blank';
					}

					if (relIdx < 0) {
						tokens[idx].attrPush(['rel', 'noopener noreferrer']);
						relIdx = tokens[idx].attrIndex('rel');
					} else {
						tokens[idx].attrs[relIdx][1] = 'noopener noreferrer';
					}
				}

				if (Markdown.config.nofollow) {
					if (relIdx < 0) {
						tokens[idx].attrPush(['rel', 'nofollow']);
					} else {
						tokens[idx].attrs[relIdx][1] += ' nofollow';
					}
				}
			}

			if (!Markdown.config.allowRTLO) {
				if (tokens[idx + 1] && tokens[idx + 1].type === 'text') {
					if (tokens[idx + 1].content.match(Markdown.regexes.rtl_override)) {
						tokens[idx + 1].content = tokens[idx + 1].content.replace(Markdown.regexes.rtl_override, '');
					}
				}
			}

			return renderLink(tokens, idx, options, env, self);
		};

		parser.renderer.rules.table_open = function (tokens, idx, options, env, self) {
			var classIdx = tokens[idx].attrIndex('class');

			if (classIdx < 0) {
				tokens[idx].attrPush(['class', 'table table-bordered table-striped']);
			} else {
				tokens[idx].attrs[classIdx][1] += ' table table-bordered table-striped';
			}

			return renderTable(tokens, idx, options, env, self);
		};

		plugins.fireHook('action:markdown.updateParserRules', parser);
	},

	isUrlValid: function (src) {
		/**
		 * Images linking to a relative path are only allowed from the root prefixes
		 * defined in allowedRoots. We allow both with and without relative_path
		 * even though upload_url should handle it, because sometimes installs
		 * migrate to (non-)subfolder and switch mid-way, but the uploads urls don't
		 * get updated.
		 */
		const allowedRoots = [nconf.get('upload_url'), '/uploads'];
		const allowed = pathname => allowedRoots.some(root => pathname.toString().startsWith(root) || pathname.toString().startsWith(nconf.get('relative_path') + root));

		try {
			var urlObj = url.parse(src, false, true);
			return !(urlObj.host === null && !allowed(urlObj.pathname));
		} catch (e) {
			return false;
		}
	},

	isExternalLink: function (urlString) {
		var urlObj;
		var baseUrlObj;
		try {
			urlObj = url.parse(urlString);
			baseUrlObj = url.parse(nconf.get('url'));
		} catch (err) {
			return false;
		}

		if (
			urlObj.host === null	// Relative paths are always internal links...
			|| (urlObj.host === baseUrlObj.host && urlObj.protocol === baseUrlObj.protocol	// Otherwise need to check that protocol and host match
			&& (nconf.get('relative_path').length > 0 ? urlObj.pathname.indexOf(nconf.get('relative_path')) === 0 : true))	// Subfolder installs need this additional check
		) {
			return false;
		}
		return true;
	},

	admin: {
		menu: function (custom_header, callback) {
			custom_header.plugins.push({
				route: '/plugins/markdown',
				icon: 'fa-edit',
				name: 'Markdown',
			});

			callback(null, custom_header);
		},
	},

	regexes: {
		rtl_override: /\u202E/gi,
	},
};

module.exports = Markdown;
