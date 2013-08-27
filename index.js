var	marked = require('marked'),
	Markdown = {
		markdownify: function(raw) {
			return marked(raw);
		}
	};

marked.setOptions({
	breaks: true
});

module.exports = Markdown;