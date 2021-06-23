'use strict';

const MarkdownIt = require('markdown-it');
const fs = require('fs');
const path = require('path');
const url = require('url');

const nconf = require.main.require('nconf');
const winston = require.main.require('winston');
const meta = require.main.require('./src/meta');
const posts = require.main.require('./src/posts');
const translator = require.main.require('./src/translator');
const plugins = require.main.require('./src/plugins');

const SocketPlugins = require.main.require('./src/socket.io/plugins');
SocketPlugins.markdown = require('./websockets');

let parser;

const Markdown = {
	config: {},
	onLoad: async function (params) {
		const controllers = require('./lib/controllers');
		const hostMiddleware = require.main.require('./src/middleware');
		const middlewares = [hostMiddleware.maintenanceMode, hostMiddleware.registrationComplete, hostMiddleware.pluginHooks];

		params.router.get('/admin/plugins/markdown', params.middleware.admin.buildHeader, controllers.renderAdmin);
		params.router.get('/api/admin/plugins/markdown', controllers.renderAdmin);

		// Return raw markdown via GET
		params.router.get('/api/post/:pid/raw', middlewares, controllers.retrieveRaw);

		Markdown.init();
		Markdown.loadThemes();

		return params;
	},

	getConfig: function (config) {
		config.markdown = {
			highlight: Markdown.highlight ? 1 : 0,
			highlightLinesLanguageList: Markdown.config.highlightLinesLanguageList,
			theme: Markdown.config.highlightTheme || 'railscasts.css',
		};
		return config;
	},

	getLinkTags: function (hookData) {
		hookData.links.push({
			rel: 'prefetch stylesheet',
			type: '',
			href: `${nconf.get('relative_path')}/plugins/nodebb-plugin-markdown/styles/${Markdown.config.highlightTheme || 'railscasts.css'}`,
		});

		const prefetch = ['/assets/src/modules/highlight.js', `/assets/language/${meta.config.defaultLang || 'en-GB'}/markdown.json`];
		hookData.links = hookData.links.concat(
			prefetch.map((path) => ({
				rel: 'prefetch',
				href: nconf.get('relative_path') + path + '?' + meta.config['cache-buster'],
			}))
		);

		return hookData;
	},

	init: function () {
		// Load saved config
		const _self = this;
		const defaults = {
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
			checkboxes: true,
			multimdTables: true,
		};

		meta.settings.get('markdown', function (err, options) {
			if (err) {
				winston.warn(`[plugin/markdown] Unable to retrieve settings, assuming defaults: ${err.message}`);
			}

			for (const field in defaults) {
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
			const isStylesheet = /\.css$/;
			Markdown.themes = files.filter(function (file) {
				return isStylesheet.test(file);
			}).map(function (file) {
				return {
					name: file,
				};
			});
		});
	},

	parsePost: async function (data) {
		const env = await Markdown.beforeParse(data);
		if (data && data.postData && data.postData.content && parser) {
			data.postData.content = parser.render(data.postData.content, env || {});
		}
		return Markdown.afterParse(data);
	},

	parseSignature: async function (data) {
		if (data && data.userData && data.userData.signature && parser) {
			data.userData.signature = parser.render(data.userData.signature);
		}
		return Markdown.afterParse(data);
	},

	parseAboutMe: async function (aboutme) {
		aboutme = (aboutme && parser) ? parser.render(aboutme) : aboutme;
		// process.nextTick(next, null, aboutme);
		return Markdown.afterParse(aboutme);
	},

	parseRaw: async function (raw) {
		raw = (raw && parser) ? parser.render(raw) : raw;
		return Markdown.afterParse(raw);
	},

	beforeParse: async (data) => {
		const env = {};

		if (data && data.postData && data.postData.pid) {
			// Check that pid for images, and return their sizes
			const images = await posts.uploads.listWithSizes(data.postData.pid);
			env.images = images.reduce((memo, cur) => {
				memo.set(cur.name, cur);
				delete cur.name;
				return memo;
			}, new Map());
		}

		return env;
	},

	afterParse: function (payload) {
		if (!payload) {
			return payload;
		}
		const italicMention = /@<em>([^<]+)<\/em>/g;
		const boldMention = /@<strong>([^<]+)<\/strong>/g;
		const execute = function (html) {
			// Replace all italicised mentions back to regular mentions
			if (italicMention.test(html)) {
				html = html.replace(italicMention, function (match, slug) {
					return '@_' + slug + '_';
				});
			} else if (boldMention.test(html)) {
				html = html.replace(boldMention, function (match, slug) {
					return '@__' + slug + '__';
				});
			}

			return html;
		};

		if (payload.hasOwnProperty('postData')) {
			payload.postData.content = execute(payload.postData.content);
		} else if (payload.hasOwnProperty('userData')) {
			payload.userData.signature = execute(payload.userData.signature);
		} else {
			payload = execute(payload);
		}

		return payload;
	},

	renderHelp: async function (helpContent) {
		const translated = await translator.translate('[[markdown:help_text]]');
		const parsed = plugins.hooks.fire('filter:parse.raw', `## Markdown\n${translated}`);
		helpContent += parsed;
		return helpContent;
	},

	registerFormatting: async function (payload) {
		const formatting = [
			{ name: 'bold', className: 'fa fa-bold', title: '[[modules:composer.formatting.bold]]' },
			{ name: 'italic', className: 'fa fa-italic', title: '[[modules:composer.formatting.italic]]' },
			{ name: 'list', className: 'fa fa-list-ul', title: '[[modules:composer.formatting.list]]' },
			{ name: 'strikethrough', className: 'fa fa-strikethrough', title: '[[modules:composer.formatting.strikethrough]]' },
			{ name: 'code', className: 'fa fa-code', title: '[[modules:composer.formatting.code]]' },
			{ name: 'link', className: 'fa fa-link', title: '[[modules:composer.formatting.link]]' },
			{ name: 'picture-o', className: 'fa fa-picture-o', title: '[[modules:composer.formatting.picture]]' },
		];

		payload.options = formatting.concat(payload.options);

		return payload;
	},

	updateSanitizeConfig: async (config) => {
		config.allowedTags.push('input');
		config.allowedAttributes.input = ['type', 'checked'];
		config.allowedAttributes.ol.push('start');
		config.allowedAttributes.th.push('colspan', 'rowspan');
		config.allowedAttributes.td.push('colspan', 'rowspan');

		return config;
	},

	updateParserRules: function (parser) {
		if (Markdown.config.checkboxes) {
			// Add support for checkboxes
			parser.use(require('markdown-it-checkbox'), {
				divWrap: true,
				divClass: 'plugin-markdown',
			});
		}

		if (Markdown.config.multimdTables) {
			parser.use(require('markdown-it-multimd-table'), {
				multiline: true,
				rowspan: true,
				headerless: true,
			});
		}

		parser.use((md) => {
			md.core.ruler.before('linkify', 'autodir', (state) => {
				state.tokens.forEach((token) => {
					if (token.type === 'paragraph_open') {
						token.attrJoin('dir', 'auto');
					}
				});
			});
		});

		// Update renderer to add some classes to all images
		const renderImage = parser.renderer.rules.image || function (tokens, idx, options, env, self) {
			return self.renderToken.apply(self, arguments);
		};
		const renderLink = parser.renderer.rules.link_open || function (tokens, idx, options, env, self) {
			return self.renderToken.apply(self, arguments);
		};
		const renderTable = parser.renderer.rules.table_open || function (tokens, idx, options, env, self) {
			return self.renderToken.apply(self, arguments);
		};

		parser.renderer.rules.image = function (tokens, idx, options, env, self) {
			const token = tokens[idx];
			const attributes = new Map(token.attrs);
			const filename = path.basename(attributes.get('src'));

			// Validate the url
			if (!Markdown.isUrlValid(attributes.get('src'))) { return ''; }

			token.attrSet('class', (token.attrGet('class') || '') + ' img-responsive img-markdown');

			// Append sizes to images
			if (env.images.has(filename)) {
				const size = env.images.get(filename);
				token.attrSet('width', size.width);
				token.attrSet('height', size.height);
			}

			return renderImage(tokens, idx, options, env, self);
		};

		parser.renderer.rules.link_open = function (tokens, idx, options, env, self) {
			// Add target="_blank" to all links
			const targetIdx = tokens[idx].attrIndex('target');
			let relIdx = tokens[idx].attrIndex('rel');
			const hrefIdx = tokens[idx].attrIndex('href');

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
						tokens[idx].attrPush(['rel', 'nofollow ugc']);
					} else {
						tokens[idx].attrs[relIdx][1] += ' nofollow ugc';
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
			const classIdx = tokens[idx].attrIndex('class');

			if (classIdx < 0) {
				tokens[idx].attrPush(['class', 'table table-bordered table-striped']);
			} else {
				tokens[idx].attrs[classIdx][1] += ' table table-bordered table-striped';
			}

			return renderTable(tokens, idx, options, env, self);
		};

		plugins.hooks.fire('action:markdown.updateParserRules', parser);
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
		const allowed = (pathname) => allowedRoots.some((root) => pathname.toString().startsWith(root) || pathname.toString().startsWith(nconf.get('relative_path') + root));

		try {
			const urlObj = url.parse(src, false, true);
			return !(urlObj.host === null && !allowed(urlObj.pathname));
		} catch (e) {
			return false;
		}
	},

	isExternalLink: function (urlString) {
		let urlObj;
		let baseUrlObj;
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
		menu: async function (custom_header) {
			custom_header.plugins.push({
				route: '/plugins/markdown',
				icon: 'fa-edit',
				name: 'Markdown',
			});
			return custom_header;
		},
	},

	regexes: {
		rtl_override: /\u202E/gi,
	},
};

module.exports = Markdown;
