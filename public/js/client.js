"use strict";
/* global hljs, RELATIVE_PATH, require */

$(document).ready(function() {
	var Markdown = {}, config,
		lang = {
			en: {
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
		};

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

	require(['composer/formatting', 'composer/controls', 'components'], function(formatting, controls, components) {
		
		$(window).on('action:posts.loaded action:topic.loaded action:posts.edited', function() {
			Markdown.highlight(components.get('post/content').find('pre code'));
		});
		
		if (formatting && controls) {
			formatting.addButtonDispatch('bold', function(textarea, selectionStart, selectionEnd){
				if(selectionStart === selectionEnd){
					controls.insertIntoTextarea(textarea, '**' + lang.ru.bold + '**');
					controls.updateTextareaSelection(textarea, selectionStart + 2, selectionStart + lang.ru.bold.length + 2);
				} else {
					controls.wrapSelectionInTextareaWith(textarea, '**');
					controls.updateTextareaSelection(textarea, selectionStart + 2, selectionEnd + 2);
				}
			});

			formatting.addButtonDispatch('italic', function(textarea, selectionStart, selectionEnd){
				if(selectionStart === selectionEnd){
					controls.insertIntoTextarea(textarea, '*' + lang.ru.italic + '*');
					controls.updateTextareaSelection(textarea, selectionStart + 1, selectionStart + lang.ru.italic.length + 1);
				} else {
					controls.wrapSelectionInTextareaWith(textarea, '*');
					controls.updateTextareaSelection(textarea, selectionStart + 1, selectionEnd + 1);
				}
			});

			formatting.addButtonDispatch('list', function(textarea, selectionStart, selectionEnd){
				if(selectionStart === selectionEnd){
					controls.insertIntoTextarea(textarea, "\n* " + lang.ru.list_item);

					// Highlight "list item"
					controls.updateTextareaSelection(textarea, selectionStart + 3, selectionStart + lang.ru.list_item.length + 3);
				} else {
					controls.wrapSelectionInTextareaWith(textarea, '\n* ', '');
					controls.updateTextareaSelection(textarea, selectionStart + 3, selectionEnd + 3);
				}
			});

			formatting.addButtonDispatch('link', function(textarea, selectionStart, selectionEnd){
				if(selectionStart === selectionEnd){
					controls.insertIntoTextarea(textarea, "[" + lang.ru.link_text + "](" + lang.ru.link_url + ")");

					// Highlight "link url"
					controls.updateTextareaSelection(textarea, selectionStart + lang.ru.link_text.length + 3, selectionEnd + lang.ru.link_text.length + lang.ru.link_url.length + 3);
				} else {
					controls.wrapSelectionInTextareaWith(textarea, '[', '](' + lang.ru.link_url + ')');

					// Highlight "link url"
					controls.updateTextareaSelection(textarea, selectionEnd + 3, selectionEnd + lang.ru.link_url.length + 3);
				}
			});
		}
	});
});
