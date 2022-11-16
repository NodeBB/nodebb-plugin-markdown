'use strict';

(function () {
	var Markdown = {};

	$(window).on('action:composer.enhanced', function (evt, data) {
		var textareaEl = data.postContainer.find('textarea');
		Markdown.capturePaste(textareaEl);
		Markdown.prepareFormattingTools();
	});

	Markdown.enhanceCheckbox = function (ev, data) {
		if (!data.posts && !data.post) {
			return;
		} if (data.hasOwnProperty('post')) {
			data.posts = [data.post];
		}

		var disable;
		var checkboxEls;
		data.posts.forEach(function (post) {
			disable = !post.display_edit_tools;
			checkboxEls = $('.posts li[data-pid="' + post.pid + '"] .content div.plugin-markdown input[type="checkbox"]');

			checkboxEls.on('click', function (e) {
				if (disable) {
					// Find the post's checkboxes in DOM and make them readonly
					e.preventDefault();
				}

				// Otherwise, edit the post to reflect state change
				var _this = this;
				var pid = $(this).parents('li[data-pid]').attr('data-pid');
				var index = $(this).parents('.content').find('input[type="checkbox"]').toArray()
					.reduce(function (memo, cur, index) {
						if (cur === _this) {
							memo = index;
						}

						return memo;
					}, null);

				socket.emit('plugins.markdown.checkbox.edit', {
					pid: pid,
					index: index,
					state: $(_this).prop('checked'),
				});
			});
		});
	};

	Markdown.capturePaste = function (targetEl) {
		targetEl.on('paste', function (e) {
			var triggers = [/^>\s*/, /^\s*\*\s+/, /^\s*\d+\.\s+/, /^\s{4,}/];
			var start = e.target.selectionStart;
			var line = getLine(targetEl.val(), start);

			var trigger = triggers.reduce(function (regexp, cur) {
				if (regexp) {
					return regexp;
				}

				return cur.test(line) ? cur : false;
			}, false);

			var prefix = line.match(trigger);
			if (prefix) {
				prefix = prefix.shift();

				var payload = e.originalEvent.clipboardData.getData('text');
				var fixed = payload.replace(/^/gm, prefix).slice(prefix.length);

				setTimeout(function () {
					var replacement = targetEl.val().slice(0, start) + fixed + targetEl.val().slice(start + payload.length);
					targetEl.val(replacement);
				}, 0);
			}
		});

		function getLine(text, selectionStart) {
			// Break apart into lines, return the line the cursor is in
			var lines = text.split('\n');

			return lines.reduce(function (memo, cur) {
				if (typeof memo !== 'number') {
					return memo;
				} if (selectionStart > (memo + cur.length)) {
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
							var block = controls.getBlockData(textarea, '**', selectionStart);

							if (block.in && block.atEnd) {
								// At end of bolded string, move cursor past delimiters
								controls.updateTextareaSelection(textarea, selectionStart + 2, selectionStart + 2);
							} else {
								controls.insertIntoTextarea(textarea, '**' + strings.bold + '**');
								controls.updateTextareaSelection(
									textarea, selectionStart + 2, selectionStart + strings.bold.length + 2
								);
							}
						} else {
							var wrapDelta = controls.wrapSelectionInTextareaWith(textarea, '**');
							controls.updateTextareaSelection(
								textarea, selectionStart + 2 + wrapDelta[0], selectionEnd + 2 - wrapDelta[1]
							);
						}
					});

					formatting.addButtonDispatch('italic', function (textarea, selectionStart, selectionEnd) {
						if (selectionStart === selectionEnd) {
							var block = controls.getBlockData(textarea, '*', selectionStart);

							if (block.in && block.atEnd) {
								// At end of italicised string, move cursor past delimiters
								controls.updateTextareaSelection(textarea, selectionStart + 1, selectionStart + 1);
							} else {
								controls.insertIntoTextarea(textarea, '*' + strings.italic + '*');
								controls.updateTextareaSelection(
									textarea, selectionStart + 1, selectionStart + strings.italic.length + 1
								);
							}
						} else {
							var wrapDelta = controls.wrapSelectionInTextareaWith(textarea, '*');
							controls.updateTextareaSelection(
								textarea, selectionStart + 1 + wrapDelta[0], selectionEnd + 1 - wrapDelta[1]
							);
						}
					});

					formatting.addButtonDispatch('list', function (textarea, selectionStart, selectionEnd) {
						if (selectionStart === selectionEnd) {
							controls.insertIntoTextarea(textarea, '\n* ' + strings.list_item);

							// Highlight "list item"
							controls.updateTextareaSelection(
								textarea, selectionStart + 3, selectionStart + strings.list_item.length + 3
							);
						} else {
							var wrapDelta = controls.wrapSelectionInTextareaWith(textarea, '\n* ', '');
							controls.updateTextareaSelection(
								textarea, selectionStart + 3 + wrapDelta[0], selectionEnd + 3 - wrapDelta[1]
							);
						}
					});

					formatting.addButtonDispatch('strikethrough', function (textarea, selectionStart, selectionEnd) {
						if (selectionStart === selectionEnd) {
							var block = controls.getBlockData(textarea, '~~', selectionStart);

							if (block.in && block.atEnd) {
								// At end of bolded string, move cursor past delimiters
								controls.updateTextareaSelection(textarea, selectionStart + 2, selectionStart + 2);
							} else {
								controls.insertIntoTextarea(textarea, '~~' + strings.strikethrough_text + '~~');
								controls.updateTextareaSelection(
									textarea, selectionStart + 2, selectionEnd + strings.strikethrough_text.length + 2
								);
							}
						} else {
							var wrapDelta = controls.wrapSelectionInTextareaWith(textarea, '~~', '~~');
							controls.updateTextareaSelection(
								textarea, selectionStart + 2 + wrapDelta[0], selectionEnd + 2 - wrapDelta[1]
							);
						}
					});

					formatting.addButtonDispatch('code', function (textarea, selectionStart, selectionEnd) {
						if (selectionStart === selectionEnd) {
							controls.insertIntoTextarea(textarea, '```\n' + strings.code_text + '\n```');
							controls.updateTextareaSelection(
								textarea, selectionStart + 4, selectionEnd + strings.code_text.length + 4
							);
						} else {
							var wrapDelta = controls.wrapSelectionInTextareaWith(textarea, '```\n', '\n```');
							controls.updateTextareaSelection(
								textarea, selectionStart + 4 + wrapDelta[0], selectionEnd + 4 - wrapDelta[1]
							);
						}
					});

					formatting.addButtonDispatch('link', function (textarea, selectionStart, selectionEnd) {
						if (selectionStart === selectionEnd) {
							controls.insertIntoTextarea(textarea, '[' + strings.link_text + '](' + strings.link_url + ')');
							controls.updateTextareaSelection(
								textarea,
								selectionStart + strings.link_text.length + 3,
								selectionEnd + strings.link_text.length + strings.link_url.length + 3
							);
						} else {
							var wrapDelta = controls.wrapSelectionInTextareaWith(textarea, '[', '](' + strings.link_url + ')');
							controls.updateTextareaSelection(
								textarea, selectionEnd + 3 - wrapDelta[1], selectionEnd + strings.link_url.length + 3 - wrapDelta[1]
							);
						}
					});

					formatting.addButtonDispatch('picture-o', function (textarea, selectionStart, selectionEnd) {
						if (selectionStart === selectionEnd) {
							controls.insertIntoTextarea(textarea, '![' + strings.picture_text + '](' + strings.picture_url + ')');
							controls.updateTextareaSelection(
								textarea,
								selectionStart + strings.picture_text.length + 4,
								selectionEnd + strings.picture_text.length + strings.picture_url.length + 4
							);
						} else {
							var wrapDelta = controls.wrapSelectionInTextareaWith(textarea, '![', '](' + strings.picture_url + ')');
							controls.updateTextareaSelection(
								textarea, selectionEnd + 4 - wrapDelta[1], selectionEnd + strings.picture_url.length + 4 - wrapDelta[1]
							);
						}
					});
				});
			}
		});
	};

	async function highlight(elements) {
		if (parseInt(config.markdown.highlight, 10)) {
			const { default: hljs } = await import('highlight.js/lib/common');
			window.hljs = hljs;
			require('highlightjs-line-numbers.js');

			elements.each(function (i, block) {
				const parentNode = $(block.parentNode);
				if (parentNode.hasClass('markdown-highlight')) {
					return;
				}
				parentNode.addClass('markdown-highlight');

				// Default language if set in ACP
				if (!Array.prototype.some.call(block.classList, (className) => className.startsWith('language-')) && config.markdown.defaultHighlightLanguage) {
					block.classList.add(`language-${config.markdown.defaultHighlightLanguage}`);
				}

				window.hljs.highlightElement(block);

				// Check detected language against whitelist and add lines if enabled
				if (block.className.split(' ').map(function (className) {
					if (className.indexOf('language-') === 0) {
						className = className.slice(9);
					}
					return config.markdown.highlightLinesLanguageList.includes(className) || config.markdown.highlightLinesLanguageList.includes(className);
				}).some(Boolean)) {
					$(block).attr('data-lines', 1);
					window.hljs.lineNumbersBlock(block);
				}
			});
		}
	}

	$(window).on('action:composer.preview', {
		selector: '.composer .preview pre code',
	}, Markdown.highlight);

	$(window).on('action:topic.loaded', Markdown.enhanceCheckbox);
	$(window).on('action:posts.loaded', Markdown.enhanceCheckbox);
	$(window).on('action:posts.edited', Markdown.enhanceCheckbox);

	$(window).on('action:posts.loaded action:topic.loaded action:posts.edited', function () {
		require(['components'], function (components) {
			Markdown.highlight(components.get('post/content').find('pre code'));
		});
	});
}());
