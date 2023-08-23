'use strict';

(function () {
	require(['markdown', 'components'], (markdown, components) => {
		async function initHljs() {
			if (window.hljs) {
				return;
			}
			console.debug('[plugin/markdown] Initializing highlight.js');
			let hljs;
			let list;
			if (config.markdown.hljsLanguages.includes('common')) {
				({ default: hljs} = await import(`highlight.js/lib/common`));
				list = 'common';
			} else if (config.markdown.hljsLanguages.includes('all')) {
				({ default: hljs} = await import(`highlight.js`));
				list = 'all';
			} else {
				({ default: hljs} = await import(`highlight.js/lib/core`));
				list = 'core';
			}

			console.debug(`[plugins/markdown] Loaded ${list} hljs library`);

			if (list !== 'all') {
				await Promise.all(config.markdown.hljsLanguages.map(async (language) => {
					if (['common', 'all'].includes(language)) {
						return;
					}

					console.debug(`[plugins/markdown] Loading ${language} support`);
					const { default: lang } = await import('../../node_modules/highlight.js/lib/languages/' + language + '.js');
					hljs.registerLanguage(language, lang);
				}));
			}
			window.hljs = hljs;
			markdown.buildAliasMap();
		}

		$(window).on('action:composer.enhanced', function (evt, data) {
			var textareaEl = data.postContainer.find('textarea');
			markdown.capturePaste(textareaEl);
			markdown.prepareFormattingTools();
		});

		$(window).on('action:composer.preview', {
			selector: '.composer .preview pre code',
		}, async (params) => {
			await initHljs();
			markdown.highlight(params)
		});

		$(window).on('action:posts.loaded action:topic.loaded action:posts.edited', async function (ev, data) {
			await initHljs();
			markdown.highlight(components.get('post/content').find('pre code'));
			markdown.enhanceCheckbox(ev, data);
			markdown.markExternalLinks();
		});
	});
}());
