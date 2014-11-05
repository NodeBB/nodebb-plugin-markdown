$(document).ready(function() {
	var Markdown = {};

	Markdown.init = function() {
		$.get(RELATIVE_PATH + '/markdown/config', function(config) {
			window.Markdown = config;

			var cssEl = document.createElement('link');
			cssEl.rel = 'stylesheet';
			cssEl.href = RELATIVE_PATH + '/plugins/nodebb-plugin-markdown/styles/' + config.theme;
			document.head.appendChild(cssEl);
		});
	};

	Markdown.highlight = function(ev, retry) {
		if (window.Markdown) {
			if (window.Markdown.highlight) {
				var codeBlocks = $('.topic-text pre code');

				codeBlocks.each(function(i, block) {
					hljs.highlightBlock(block);
				});
			}
		} else if (!retry) {
			// Try once more in one second
			setTimeout(function() {
				Markdown.highlight(null, true);
			}, 1000);
		}
	};

	$(window).on('action:connected', Markdown.init);
	$(window).on('action:posts.loaded action:topic.loaded action:posts.edited', Markdown.highlight);
});
