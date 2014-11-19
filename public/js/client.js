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

	Markdown.highlight = function(ev) {
		if (config) {
			highlight();
		} else {
			done = highlight;
		}
	};

	function highlight() {
		if (config.highlight) {
			var codeBlocks = $('.topic-text pre code');

			codeBlocks.each(function(i, block) {
				hljs.highlightBlock(block);
			});
		}
	}

	$(window).on('action:connected', Markdown.init);
	$(window).on('action:posts.loaded action:topic.loaded action:posts.edited', Markdown.highlight);
});
