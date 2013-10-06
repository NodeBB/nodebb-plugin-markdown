var	marked = require('marked'),
	hljs = require('highlight.js'),
	Markdown = {
		markdownify: function(raw) {
			return marked(raw);
		}
	};

marked.setOptions({
	breaks: true,
	sanitize: true,
	highlight: function (code, lang) {
		return hljs.highlightAuto(code).value;
	}
});

module.exports = Markdown;