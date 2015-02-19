"use strict";
/* global hljs, RELATIVE_PATH, require */

$(document).ready(function() {
	var Markdown = {}, config, done;

	$.get(RELATIVE_PATH + '/markdown/config', function(_config) {
		config = _config;

		var cssEl = document.createElement('link');
		cssEl.rel = 'stylesheet';
		cssEl.href = RELATIVE_PATH + '/plugins/nodebb-plugin-markdown/styles/' + config.theme;

		var head = document.head || document.getElementsByTagName("head")[0];
		if (head) {
			head.appendChild(cssEl);
		}

		if (done) {
			done();
		}
	});
	
	Markdown.highlight = function(e) {
		if (config) {
			highlight(e.data.selector);
		} else {
			done = function() {
				highlight(e.data.selector);
			}
		}
	};

	function highlight(selector) {
		if (config.highlight) {
			var codeBlocks = $(selector);

			codeBlocks.each(function(i, block) {
				hljs.highlightBlock(block);
			});
		}
	}

	$(window).on('action:posts.loaded action:topic.loaded action:posts.edited', {
		selector: '.topic-text pre code, .post-content pre code'
	}, Markdown.highlight);
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
