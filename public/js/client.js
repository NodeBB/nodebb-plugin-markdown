'use strict';

/* global document, window, jQuery, $, require, config */

$(document).ready(function () {
	var Markdown = {};

	$(window).on('action:composer.enhanced', function (evt, data) {
		var textareaEl = data.postContainer.find('textarea');
		Markdown.capturePaste(textareaEl);
		Markdown.prepareFormattingTools();
	});

	Markdown.capturePaste = function (targetEl) {
		targetEl.on('paste', function (e) {
			var triggers = [/^\>\s*/, /^\s*\*\s+/, /^\s*\d+\.\s+/, /^\s{4,}/];
			var start = e.target.selectionStart;
			var line = getLine(targetEl.val(), start);

			var trigger = triggers.reduce(function (regexp, cur) {
				if (regexp) {
					return regexp;
				}

				return cur.test(line) ? cur : false;
			}, false);
			var prefix = line.match(trigger)[0];

			var payload = e.originalEvent.clipboardData.getData('text');
			var fixed = payload.replace(/^/gm, prefix).slice(prefix.length);

			setTimeout(function () {
				var replacement = targetEl.val().slice(0, start) + fixed + targetEl.val().slice(start + payload.length);
				targetEl.val(replacement);
			}, 0);
		});

		function getLine(text, selectionStart) {
			// Break apart into lines, return the line the cursor is in
			var lines = text.split('\n');

			return lines.reduce(function (memo, cur) {
				if (typeof memo !== 'number') {
					return memo;
				} else if (selectionStart > (memo + cur.length)) {
					return memo + cur.length + 1;
				}

				return cur;
			}, 0);
		}
	};

	Markdown.highlight = function (data) {
		if (data instanceof jQuery.Event) {
			highlight($(data.data.selector));
		} else {
			highlight(data);
		}
	};

	Markdown.prepareFormattingTools = function () {
		require([
			'composer/formatting',
			'composer/controls',
			'translator',
		], function (formatting, controls, translator) {
			if (formatting && controls) {
				translator.getTranslations(window.config.userLang || window.config.defaultLang, 'markdown', function (strings) {
					formatting.addButtonDispatch('bold', function (textarea, selectionStart, selectionEnd) {
						if (selectionStart === selectionEnd) {
							controls.insertIntoTextarea(textarea, '**' + strings.bold + '**');
							controls.updateTextareaSelection(textarea, selectionStart + 2, selectionStart + strings.bold.length + 2);
						} else {
							var wrapDelta = controls.wrapSelectionInTextareaWith(textarea, '**');
							controls.updateTextareaSelection(textarea, selectionStart + 2 + wrapDelta[0], selectionEnd + 2 - wrapDelta[1]);
						}
					});

					formatting.addButtonDispatch('italic', function (textarea, selectionStart, selectionEnd) {
						if (selectionStart === selectionEnd) {
							controls.insertIntoTextarea(textarea, '*' + strings.italic + '*');
							controls.updateTextareaSelection(textarea, selectionStart + 1, selectionStart + strings.italic.length + 1);
						} else {
							var wrapDelta = controls.wrapSelectionInTextareaWith(textarea, '*');
							controls.updateTextareaSelection(textarea, selectionStart + 1 + wrapDelta[0], selectionEnd + 1 - wrapDelta[1]);
						}
					});

					formatting.addButtonDispatch('list', function (textarea, selectionStart, selectionEnd) {
						if (selectionStart === selectionEnd) {
							controls.insertIntoTextarea(textarea, '\n* ' + strings.list_item);

							// Highlight "list item"
							controls.updateTextareaSelection(textarea, selectionStart + 3, selectionStart + strings.list_item.length + 3);
						} else {
							var wrapDelta = controls.wrapSelectionInTextareaWith(textarea, '\n* ', '');
							controls.updateTextareaSelection(textarea, selectionStart + 3 + wrapDelta[0], selectionEnd + 3 - wrapDelta[1]);
						}
					});

					formatting.addButtonDispatch('strikethrough', function (textarea, selectionStart, selectionEnd) {
						if (selectionStart === selectionEnd) {
							controls.insertIntoTextarea(textarea, '~~' + strings.strikethrough_text + '~~');
							controls.updateTextareaSelection(textarea, selectionStart + 2, selectionEnd + strings.strikethrough_text.length + 2);
						} else {
							var wrapDelta = controls.wrapSelectionInTextareaWith(textarea, '~~', '~~');
							controls.updateTextareaSelection(textarea, selectionStart + 2 + wrapDelta[0], selectionEnd + 2 - wrapDelta[1]);
						}
					});

					formatting.addButtonDispatch('link', function (textarea, selectionStart, selectionEnd) {
						if (selectionStart === selectionEnd) {
							controls.insertIntoTextarea(textarea, '[' + strings.link_text + '](' + strings.link_url + ')');
							controls.updateTextareaSelection(textarea, selectionStart + strings.link_text.length + 3, selectionEnd + strings.link_text.length + strings.link_url.length + 3);
						} else {
							var wrapDelta = controls.wrapSelectionInTextareaWith(textarea, '[', '](' + strings.link_url + ')');
							controls.updateTextareaSelection(textarea, selectionEnd + 3 - wrapDelta[1], selectionEnd + strings.link_url.length + 3 - wrapDelta[1]);
						}
					});

					formatting.addButtonDispatch('picture-o', function (textarea, selectionStart, selectionEnd) {
						if (selectionStart === selectionEnd) {
							controls.insertIntoTextarea(textarea, '![' + strings.picture_text + '](' + strings.picture_url + ')');
							controls.updateTextareaSelection(textarea, selectionStart + strings.picture_text.length + 4, selectionEnd + strings.picture_text.length + strings.picture_url.length + 4);
						} else {
							var wrapDelta = controls.wrapSelectionInTextareaWith(textarea, '![', '](' + strings.picture_url + ')');
							controls.updateTextareaSelection(textarea, selectionEnd + 4 - wrapDelta[1], selectionEnd + strings.picture_url.length + 4 - wrapDelta[1]);
						}
					});
				});
			}
		});
	};

	function highlight(elements) {
		if (parseInt(config.markdown.highlight, 10)) {
			require(['highlight'], function (hljs) {
				elements.each(function (i, block) {
					$(block.parentNode).addClass('markdown-highlight');
					hljs.highlightBlock(block);
				});
			});
		}
	}

	$(window).on('action:composer.preview', {
		selector: '.composer .preview pre code',
	}, Markdown.highlight);


	require(['components'], function (components) {
		$(window).on('action:posts.loaded action:topic.loaded action:posts.edited', function () {
			Markdown.highlight(components.get('post/content').find('pre code'));
		});
	});
});
