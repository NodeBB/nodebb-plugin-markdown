'use strict';

const MarkdownIt = require('markdown-it');
const fs = require('fs');
const path = require('path');

const probe = require('probe-image-size');

const nconf = require.main.require('nconf');
const winston = require.main.require('winston');
const meta = require.main.require('./src/meta');
const posts = require.main.require('./src/posts');
const translator = require.main.require('./src/translator');
const plugins = require.main.require('./src/plugins');
const cacheCreate = require.main.require('./src/cacheCreate');

const SocketPlugins = require.main.require('./src/socket.io/plugins');
SocketPlugins.markdown = require('./websockets');

let parser;
let app;
const Markdown = {
	config: {},
	_externalImageCache: undefined,
	_externalImageFailures: new Set(),
	onLoad: async function (params) {
		app = params.app;
		const { router } = params;
		const controllers = require('./lib/controllers');
		const hostMiddleware = require.main.require('./src/middleware');
		const routeHelpers = require.main.require('./src/routes/helpers');
		const middlewares = [
			hostMiddleware.maintenanceMode, hostMiddleware.registrationComplete, hostMiddleware.pluginHooks,
		];

		routeHelpers.setupAdminPageRoute(router, '/admin/plugins/markdown', controllers.renderAdmin);

		// Return raw markdown via GET
		router.get('/api/post/:pid/raw', middlewares, controllers.retrieveRaw);

		Markdown.init();
		await Markdown.loadThemes();
	},

	getConfig: async (config) => {
		let { defaultHighlightLanguage, highlightTheme, hljsLanguages, highlightLinesLanguageList, externalMark } = await meta.settings.get('markdown');

		try {
			hljsLanguages = JSON.parse(hljsLanguages);
		} catch (e) {
			hljsLanguages = ['common'];
		}

		config.markdown = {
			highlight: Markdown.highlight ? 1 : 0,
			highlightLinesLanguageList,
			hljsLanguages,
			theme: highlightTheme || 'default.css',
			defaultHighlightLanguage: defaultHighlightLanguage || '',
			externalMark: externalMark === 'on',
		};

		return config;
	},

	getLinkTags: async (hookData) => {
		const { highlightTheme } = await meta.settings.get('markdown');

		hookData.links.push({
			rel: 'prefetch stylesheet',
			type: '',
			href: `${nconf.get('relative_path')}/assets/plugins/nodebb-plugin-markdown/styles/${highlightTheme || 'default.css'}`,
		}, {
			rel: 'prefetch',
			href: `${nconf.get('relative_path')}/assets/language/${meta.config.defaultLang || 'en-GB'}/markdown.json?${meta.config['cache-buster']}`,
		});

		return hookData;
	},

	init: function () {
		// Load saved config
		const _self = this;
		const defaults = {
			html: false,

			langPrefix: 'language-',
			highlight: true,
			highlightTheme: 'default.css',

			probe: true,
			probeCacheSize: 256,

			xhtmlOut: true,
			breaks: true,
			linkify: true,
			typographer: false,
			externalBlank: false,
			nofollow: true,
			allowRTLO: false,
			checkboxes: true,
			multimdTables: true,
		};
		const notCheckboxes = ['langPrefix', 'highlightTheme', 'probeCacheSize'];

		meta.settings.get('markdown', (err, options) => {
			if (err) {
				winston.warn(`[plugin/markdown] Unable to retrieve settings, assuming defaults: ${err.message}`);
			}

			Object.keys(defaults).forEach((field) => {
				// If not set in config (nil)
				if (!options.hasOwnProperty(field)) {
					_self.config[field] = defaults[field];
				} else if (!notCheckboxes.includes(field)) {
					_self.config[field] = options[field] === 'on';
				} else {
					_self.config[field] = options[field];
				}
			});

			_self.highlight = _self.config.highlight;
			delete _self.config.highlight;

			parser = new MarkdownIt(_self.config);

			Markdown.updateParserRules(parser);

			// External image size cache
			if (_self.config.probe) {
				Markdown._externalImageCache = cacheCreate({
					name: 'markdown.externalImageCache',
					max: parseInt(_self.config.probeCacheSize, 10) || 256,
					ttl: 1000 * 60 * 60 * 24, // 1 day
				});
			}
		});
	},

	loadThemes: async () => {
		try {
			const files = await fs.promises.readdir(path.join(require.resolve('highlight.js'), '../../styles'));
			const isStylesheet = /\.css$/;
			Markdown.themes = files.filter(file => isStylesheet.test(file));
		} catch (err) {
			winston.error(`[plugin/markdown] Could not load Markdown themes: ${err.message}`);
			Markdown.themes = [];
		}
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
		const env = {
			images: new Map(),
		};

		if (data && data.postData && data.postData.pid) {
			// Check that pid for images, and return their sizes
			const images = await posts.uploads.listWithSizes(data.postData.pid);
			env.images = images.reduce((memo, cur) => {
				memo.set(cur.name, cur);
				delete cur.name;
				return memo;
			}, env.images);
		}

		// Probe post data for external images as well
		if (Markdown.config.probe && data && data.postData && data.postData.content) {
			const matcher = /!\[[^\]]*?\]\((https?[^)]+?)\)/g;
			let current;

			// eslint-disable-next-line no-cond-assign
			while ((current = matcher.exec(data.postData.content)) !== null) {
				const match = current[1];
				if (match && Markdown.isExternalLink(match)) { // for security only parse external images
					const parsedUrl = new URL(match, nconf.get('url'));
					const filename = path.basename(parsedUrl.pathname);
					const size = Markdown._externalImageCache.get(match);

					// Short-circuit to ignore previous failures
					const hasFailed = Markdown._externalImageFailures.has(match);
					if (!hasFailed) {
						if (size) {
							env.images.set(filename, size);
						} else {
							// Size checked asynchronously, see: https://github.com/tomas/needle/issues/389
							probe(match, {
								follow_max: 2,
							}).then((size) => {
								let { width, height } = size;

								// Swap width and height if orientation bit is set
								if (size.orientation >= 5 && size.orientation <= 8) {
									[width, height] = [height, width];
								}

								Markdown._externalImageCache.set(match, { width, height });
							}).catch(() => {
								// Likely an issue getting the external image size, ignore in the future
								Markdown._externalImageFailures.add(match);
							});
						}
					}
				}
			}
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
				html = html.replace(italicMention, (match, slug) => `@_${slug}_`);
			} else if (boldMention.test(html)) {
				html = html.replace(boldMention, (match, slug) => `@__${slug}__`);
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
		const translated = await translator.translate('[[markdown:help-text]]');
		const parsed = await plugins.hooks.fire('filter:parse.raw', `## Markdown\n${translated}`);
		const html = await app.renderAsync('modals/markdown-help', {});
		helpContent += parsed + html;
		return helpContent;
	},

	registerFormatting: async function (payload) {
		const formatting = [
			{ name: 'bold', className: 'fa fa-bold', title: '[[modules:composer.formatting.bold]]' },
			{ name: 'italic', className: 'fa fa-italic', title: '[[modules:composer.formatting.italic]]' },
			{
				className: 'fa fa-heading',
				title: '[[modules:composer.formatting.heading]]',
				dropdownItems: [
					{ name: 'heading1', text: '[[modules:composer.formatting.heading1]]' },
					{ name: 'heading2', text: '[[modules:composer.formatting.heading2]]' },
					{ name: 'heading3', text: '[[modules:composer.formatting.heading3]]' },
					{ name: 'heading4', text: '[[modules:composer.formatting.heading4]]' },
					{ name: 'heading5', text: '[[modules:composer.formatting.heading5]]' },
					{ name: 'heading6', text: '[[modules:composer.formatting.heading6]]' },
				],
			},
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
			// eslint-disable-next-line prefer-spread,prefer-rest-params
			return self.renderToken.apply(self, arguments);
		};
		const renderLink = parser.renderer.rules.link_open || function (tokens, idx, options, env, self) {
			// eslint-disable-next-line prefer-spread,prefer-rest-params
			return self.renderToken.apply(self, arguments);
		};
		const renderTable = parser.renderer.rules.table_open || function (tokens, idx, options, env, self) {
			// eslint-disable-next-line prefer-spread,prefer-rest-params
			return self.renderToken.apply(self, arguments);
		};

		parser.renderer.rules.image = function (tokens, idx, options, env, self) {
			const token = tokens[idx];
			const attributes = new Map(token.attrs);
			const parsedSrc = new URL(attributes.get('src'), nconf.get('url'));

			// Validate the url
			if (!Markdown.isUrlValid(attributes.get('src'))) { return ''; }

			token.attrSet('class', `${token.attrGet('class') || ''} img-fluid img-markdown`);

			// Append sizes to images
			if (parsedSrc.pathname) {
				const filename = path.basename(parsedSrc.pathname);
				if (env.images && env.images.has(filename)) {
					const size = env.images.get(filename);
					token.attrSet('width', size.width);
					token.attrSet('height', size.height);
				}
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
		const allowed = pathname => allowedRoots.some(root => pathname.toString().startsWith(root) || pathname.toString().startsWith(nconf.get('relative_path') + root));

		try {
			const urlObj = new URL(src, nconf.get('url'));
			return !(urlObj.host === null && !allowed(urlObj.pathname));
		} catch (e) {
			return false;
		}
	},

	isExternalLink: function (urlString) {
		let urlObj;
		let baseUrlObj;
		try {
			urlObj = new URL(urlString, nconf.get('url'));
			baseUrlObj = nconf.get('url_parsed');
		} catch (err) {
			return false;
		}

		if (
			urlObj.host === null || // Relative paths are always internal links...
			(
				urlObj.host === baseUrlObj.host &&
				urlObj.protocol === baseUrlObj.protocol && // Otherwise need to check that protocol and host match
				(nconf.get('relative_path').length > 0 ? urlObj.pathname.indexOf(nconf.get('relative_path')) === 0 : true) // Subfolder installs need this additional check
			)
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
