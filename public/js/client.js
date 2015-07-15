"use strict";
/* global hljs, RELATIVE_PATH, require */

$(document).ready(function() {
	var Markdown = {}, config,
		lang = {
			en_GB: {
				bold: 'bolded text',
				italic: 'italicised text',
				list_item: 'list item',
				link_text: 'link text',
				link_url: 'link url'
			},
			ru: {
				bold: 'Жирный текст',
				italic: 'Прописной шрифт',
				list_item: 'Пункт списка',
				link_text: 'Текст ссылки',
				link_url: 'Адрес ссылки'
			}
		}
		strings = lang[window.config.defaultLang] || lang.en_GB;

	$(window).on('action:connected', function() {
		Markdown.prepareFormattingTools();
	});

	$.get(RELATIVE_PATH + '/markdown/config', function(_config) {
		config = _config;

		var cssEl = document.createElement('link');
		cssEl.rel = 'stylesheet';
		cssEl.href = RELATIVE_PATH + '/plugins/nodebb-plugin-markdown/styles/' + config.theme;

		var head = document.head || document.getElementsByTagName("head")[0];
		if (head) {
			head.appendChild(cssEl);
		}

		$(window).trigger('markdown.ready');
	});
	
	Markdown.highlight = function(data) {
		if (data instanceof jQuery.Event) {
			highlight($(data.data.selector));
		} else {
			highlight(data);
		}
	};

	Markdown.prepareFormattingTools = function() {
		require(['composer/formatting', 'composer/controls', 'translator'], function(formatting, controls, translator) {
			if (formatting && controls) {
				translator.getTranslations(window.config.userLang || window.config.defaultLang, 'markdown', function(strings) {
					formatting.addButtonDispatch('bold', function(textarea, selectionStart, selectionEnd){
						if(selectionStart === selectionEnd){
							controls.insertIntoTextarea(textarea, '**' + strings.bold + '**');
							controls.updateTextareaSelection(textarea, selectionStart + 2, selectionStart + strings.bold.length + 2);
						} else {
							controls.wrapSelectionInTextareaWith(textarea, '**');
							controls.updateTextareaSelection(textarea, selectionStart + 2, selectionEnd + 2);
						}
					});

					formatting.addButtonDispatch('italic', function(textarea, selectionStart, selectionEnd){
						if(selectionStart === selectionEnd){
							controls.insertIntoTextarea(textarea, '*' + strings.italic + '*');
							controls.updateTextareaSelection(textarea, selectionStart + 1, selectionStart + strings.italic.length + 1);
						} else {
							controls.wrapSelectionInTextareaWith(textarea, '*');
							controls.updateTextareaSelection(textarea, selectionStart + 1, selectionEnd + 1);
						}
					});

					formatting.addButtonDispatch('list', function(textarea, selectionStart, selectionEnd){
						if(selectionStart === selectionEnd){
							controls.insertIntoTextarea(textarea, "\n* " + strings.list_item);

							// Highlight "list item"
							controls.updateTextareaSelection(textarea, selectionStart + 3, selectionStart + strings.list_item.length + 3);
						} else {
							controls.wrapSelectionInTextareaWith(textarea, '\n* ', '');
							controls.updateTextareaSelection(textarea, selectionStart + 3, selectionEnd + 3);
						}
					});

					formatting.addButtonDispatch('link', function(textarea, selectionStart, selectionEnd){
						if(selectionStart === selectionEnd){
							controls.insertIntoTextarea(textarea, "[" + strings.link_text + "](" + strings.link_url + ")");

							// Highlight "link url"
							controls.updateTextareaSelection(textarea, selectionStart + strings.link_text.length + 3, selectionEnd + strings.link_text.length + strings.link_url.length + 3);
						} else {
							controls.wrapSelectionInTextareaWith(textarea, '[', '](' + strings.link_url + ')');

							// Highlight "link url"
							controls.updateTextareaSelection(textarea, selectionEnd + 3, selectionEnd + strings.link_url.length + 3);
						}
					});
				})
			}
		});
	};

	function highlight(elements) {
		if (!config) {
			return $(window).on('markdown.ready', highlight.bind(null, elements));
		}

		function highlightBlock() {
			codeBlocks.each(function(i, block) {
				$(block.parentNode).addClass('markdown-highlight');
				hljs.highlightBlock(block);
			});
		}

		if (config.highlight) {
			var codeBlocks = elements;

			if (typeof hljs === 'undefined') {
				$.getScript(RELATIVE_PATH + '/plugins/nodebb-plugin-markdown/js/highlight.js', highlightBlock);	
			} else {
				highlightBlock();
			}
		}
	}

	$(window).on('action:composer.preview', {
		selector: '.composer .preview pre code'
	}, Markdown.highlight);

	require(['components'], function(components) {
		$(window).on('action:posts.loaded action:topic.loaded action:posts.edited', function() {
			Markdown.highlight(components.get('post/content').find('pre code'));
		});
	});
});
