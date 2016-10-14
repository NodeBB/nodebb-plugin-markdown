"use strict";
/* global hljs, RELATIVE_PATH, require, config */

$(document).ready(function() {
	var Markdown = {};

	$(window).on('action:composer.enhanced', function() {
		Markdown.prepareFormattingTools();
	});

	Markdown.highlight = function(data) {
		if (data instanceof jQuery.Event) {
			highlight($(data.data.selector));
		} else {
			highlight(data);
		}
	};

	Markdown.prepareFormattingTools = function() {
		require([
			'composer/formatting',
			'composer/controls',
			'translator'
		], function(formatting, controls, translator) {
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

					formatting.addButtonDispatch('strikethrough', function(textarea, selectionStart, selectionEnd){
						console.log(strings);
						if(selectionStart === selectionEnd){
							controls.insertIntoTextarea(textarea, "~~" + strings.strikethrough_text + "~~");
							controls.updateTextareaSelection(textarea, selectionStart + 2, selectionEnd + strings.strikethrough_text.length + 2);
						} else {
							controls.wrapSelectionInTextareaWith(textarea, '~~', '~~');
							controls.updateTextareaSelection(textarea, selectionStart + 2, selectionEnd + 2);
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

					formatting.addButtonDispatch('picture-o', function(textarea, selectionStart, selectionEnd){
						if(selectionStart === selectionEnd){
							controls.insertIntoTextarea(textarea, "![" + strings.picture_text + "](" + strings.picture_url + ")");

							// Highlight "picture url"
							controls.updateTextareaSelection(textarea, selectionStart + strings.picture_text.length + 4, selectionEnd + strings.picture_text.length + strings.picture_url.length + 4);
						} else {
							controls.wrapSelectionInTextareaWith(textarea, '![', '](' + strings.picture_url + ')');

							// Highlight "picture url"
							controls.updateTextareaSelection(textarea, selectionEnd + 4, selectionEnd + strings.picture_url.length + 4);
						}
					});
				})
			}
		});
	};

	function highlight(elements) {
		if (parseInt(config.markdown.highlight, 10)) {
			require(['highlight'], function(hljs) {
				elements.each(function(i, block) {
					$(block.parentNode).addClass('markdown-highlight');
					hljs.highlightBlock(block);
				});
			});
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
