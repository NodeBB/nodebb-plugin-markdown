"use strict";

/*global hljs, RELATIVE_PATH*/

$(document).ready(function() {
	var Markdown = {}, config, done;

	Markdown.init = function() {
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
	};

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

	$(window).on('action:connected', Markdown.init);
	$(window).on('action:posts.loaded action:topic.loaded action:posts.edited', {
		selector: '.topic-text pre code, .post-content pre code'
	}, Markdown.highlight);
	$(window).on('action:composer.preview', {
		selector: '.composer .preview pre code'
	}, Markdown.highlight);
});
