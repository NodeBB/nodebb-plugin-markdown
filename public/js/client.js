"use strict";
/* global hljs, RELATIVE_PATH, require */

$(document).ready(function() {
	var Markdown = {}, config;

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

		if (config.highlight) {
			var codeBlocks = elements;

			codeBlocks.each(function(i, block) {
				$(block.parentNode).addClass('markdown-highlight');
				hljs.highlightBlock(block);
			});
		}
	}

	// If NodeBB supports components, send elements in directly, otherwise fall back to passing in selector
	if (window.hasOwnProperty('components')) {
		$(window).on('action:posts.loaded action:topic.loaded action:posts.edited', function() {
			Markdown.highlight(components.get('post/content').find('pre code'));
		});
	} else {
		$(window).on('action:posts.loaded action:topic.loaded action:posts.edited', {
			selector: '.topic-text pre code, .post-content pre code'
		}, Markdown.highlight);
	}

	$(window).on('action:composer.preview', {
		selector: '.composer .preview pre code'
	}, Markdown.highlight);

	require(['composer/formatting', 'composer/controls'], function(formatting, controls) {
		formatting.addButtonDispatch('bold', function(textarea, selectionStart, selectionEnd){
			if(selectionStart === selectionEnd){
				controls.insertIntoTextarea(textarea, '**bolded text**');
				controls.updateTextareaSelection(textarea, selectionStart + 2, selectionStart + 13);
			} else {
				controls.wrapSelectionInTextareaWith(textarea, '**');
				controls.updateTextareaSelection(textarea, selectionStart + 2, selectionEnd + 2);
			}
		});

		formatting.addButtonDispatch('italic', function(textarea, selectionStart, selectionEnd){
			if(selectionStart === selectionEnd){
				controls.insertIntoTextarea(textarea, "*italicised text*");
				controls.updateTextareaSelection(textarea, selectionStart + 1, selectionStart + 16);
			} else {
				controls.wrapSelectionInTextareaWith(textarea, '*');
				controls.updateTextareaSelection(textarea, selectionStart + 1, selectionEnd + 1);
			}
		});

		formatting.addButtonDispatch('list', function(textarea, selectionStart, selectionEnd){
			if(selectionStart === selectionEnd){
				controls.insertIntoTextarea(textarea, "\n* list item");

				// Highlight "list item"
				controls.updateTextareaSelection(textarea, selectionStart + 3, selectionStart + 12);
			} else {
				controls.wrapSelectionInTextareaWith(textarea, '\n* ', '');
				controls.updateTextareaSelection(textarea, selectionStart + 3, selectionEnd + 3);
			}
		});

		formatting.addButtonDispatch('link', function(textarea, selectionStart, selectionEnd){
			if(selectionStart === selectionEnd){
				controls.insertIntoTextarea(textarea, "[link text](link url)");

				// Highlight "link url"
				controls.updateTextareaSelection(textarea, selectionStart + 12, selectionEnd + 20);
			} else {
				controls.wrapSelectionInTextareaWith(textarea, '[', '](link url)');

				// Highlight "link url"
				controls.updateTextareaSelection(textarea, selectionEnd + 3, selectionEnd + 11);
			}
		});
	});
});
