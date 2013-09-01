var	marked = require('marked'),
	Markdown = {
		markdownify: function(raw) {
			return marked(raw);
		}
	};

marked.setOptions({
	breaks: true,
	sanitize: true
});

module.exports = Markdown;