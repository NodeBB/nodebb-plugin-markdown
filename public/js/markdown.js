'use strict';

export function capturePaste(targetEl) {
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

export function prepareFormattingTools() {
	require([
		'composer/formatting',
		'composer/controls',
		'translator',
	], function (formatting, controls, translator) {
		if (formatting && controls) {
			translator.getTranslations(window.config.userLang || window.config.defaultLang, 'markdown', function (strings) {
				// used for h1,h2...h6
				function formatHeading(heading, textarea, selectionStart, selectionEnd) {
					if (selectionStart === selectionEnd) {
						controls.insertIntoTextarea(textarea, `${heading} ${strings.heading}`);

						controls.updateTextareaSelection(
							textarea, selectionStart + heading.length + 1, selectionStart + strings.heading.length + heading.length + 1
						);
					} else {
						const selectedText = $(textarea).val().substring(selectionStart, selectionEnd);
						const newText = `${heading} ${selectedText}`;
						controls.replaceSelectionInTextareaWith(textarea, newText);
						controls.updateTextareaSelection(textarea, selectionStart + (heading.length + 1), selectionEnd + (newText.length - selectedText.length));
					}
				}


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

				[1, 2, 3, 4, 5, 6].forEach((size) => {
					formatting.addButtonDispatch(`heading${size}`, function (textarea, selectionStart, selectionEnd) {
						formatHeading(new Array(size).fill('#').join(''), textarea, selectionStart, selectionEnd);
					});
				})

				formatting.addButtonDispatch('list', function (textarea, selectionStart, selectionEnd) {
					if (selectionStart === selectionEnd) {
						controls.insertIntoTextarea(textarea, '\n* ' + strings['list-item']);

						// Highlight "list item"
						controls.updateTextareaSelection(
							textarea, selectionStart + 3, selectionStart + strings['list-item'].length + 3
						);
					} else {
						const selectedText = $(textarea).val().substring(selectionStart, selectionEnd);
						const newText = '* ' + selectedText.split('\n').join('\n* ');
						controls.replaceSelectionInTextareaWith(textarea, newText);
						controls.updateTextareaSelection(textarea, selectionStart + 2, selectionEnd + (newText.length - selectedText.length));
					}
				});

				formatting.addButtonDispatch('strikethrough', function (textarea, selectionStart, selectionEnd) {
					if (selectionStart === selectionEnd) {
						var block = controls.getBlockData(textarea, '~~', selectionStart);

						if (block.in && block.atEnd) {
							// At end of bolded string, move cursor past delimiters
							controls.updateTextareaSelection(textarea, selectionStart + 2, selectionStart + 2);
						} else {
							controls.insertIntoTextarea(textarea, '~~' + strings['strikethrough-text'] + '~~');
							controls.updateTextareaSelection(
								textarea, selectionStart + 2, selectionEnd + strings['strikethrough-text'].length + 2
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
						controls.insertIntoTextarea(textarea, '```\n' + strings['code-text'] + '\n```');
						controls.updateTextareaSelection(
							textarea, selectionStart + 4, selectionEnd + strings['code-text'].length + 4
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
						controls.insertIntoTextarea(textarea, '[' + strings['link-text'] + '](' + strings['link-url'] + ')');
						controls.updateTextareaSelection(
							textarea,
							selectionStart + strings['link-text'].length + 3,
							selectionEnd + strings['link-text'].length + strings['link-url'].length + 3
						);
					} else {
						var wrapDelta = controls.wrapSelectionInTextareaWith(textarea, '[', '](' + strings['link-url'] + ')');
						controls.updateTextareaSelection(
							textarea, selectionEnd + 3 - wrapDelta[1], selectionEnd + strings['link-url'].length + 3 - wrapDelta[1]
						);
					}
				});

				formatting.addButtonDispatch('picture-o', function (textarea, selectionStart, selectionEnd) {
					if (selectionStart === selectionEnd) {
						controls.insertIntoTextarea(textarea, '![' + strings['picture-text'] + '](' + strings['picture-url'] + ')');
						controls.updateTextareaSelection(
							textarea,
							selectionStart + strings['picture-text'].length + 4,
							selectionEnd + strings['picture-text'].length + strings['picture-url'].length + 4
						);
					} else {
						var wrapDelta = controls.wrapSelectionInTextareaWith(textarea, '![', '](' + strings['picture-url'] + ')');
						controls.updateTextareaSelection(
							textarea, selectionEnd + 4 - wrapDelta[1], selectionEnd + strings['picture-url'].length + 4 - wrapDelta[1]
						);
					}
				});
			});
		}
	});
};

export function markExternalLinks() {
	if (!config.markdown.externalMark) {
		return;
	}

	const anchorEls = document.querySelectorAll('[component="post/content"] a');
	anchorEls.forEach((anchorEl) => {
		// Do nothing if the anchor contains only an image
		if (anchorEl.childElementCount === 1 && anchorEl.querySelector('img') && !anchorEl.text) {
			return;
		}

		// Otherwise, mark external links with icon
		const parsed = new URL(anchorEl.href, document.location.href);
		if (parsed.host != document.location.host) {
			const iconEl = document.createElement('i');
			iconEl.classList.add('fa', 'fa-external-link', 'small');
			anchorEl.append(' ', iconEl);
		}
	})
}

export function enhanceCheckbox(ev, data) {
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

export function highlight(data) {
	if (data instanceof jQuery.Event) {
		processHighlight($(data.data.selector));
	} else {
		processHighlight(data);
	}
};

const aliasMap = new Map();

export function buildAliasMap() {
	if (window.hljs) {
		const hljs = window.hljs;
		hljs.listLanguages().forEach((language) => {
			const { aliases } = hljs.getLanguage(language);
			if (aliases && Array.isArray(aliases)) {
				aliases.forEach((alias) => {
					aliasMap.set(alias, language);
				});
			}

			aliasMap.set(language, language);
		});
	}
}

async function processHighlight(elements) {
	if (parseInt(config.markdown.highlight, 10)) {
		const hljs = window.hljs;
		if (!hljs) {
			console.debug(`[plugins/markdown] Tryin to highlight without initializing hljs`);
			return;
		}

		console.debug(`[plugins/markdown] Loading support for line numbers`);

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
			const classIterator = block.classList.values();
			for (const className of classIterator) {
				if (className.startsWith('language-')) {
					const language = className.split('-')[1];
					const list = config.markdown.highlightLinesLanguageList;
					if (aliasMap.has(language) && list && list.includes(aliasMap.get(language))) {
						$(block).attr('data-lines', 1);
						window.hljs.lineNumbersBlock(block);
					}
					break;
				}
			}
		});
	}
}