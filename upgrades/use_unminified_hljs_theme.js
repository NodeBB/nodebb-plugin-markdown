'use strict';

const meta = require.main.require('./src/meta');

module.exports = {
	name: 'Update Markdown Theme to point to unminified file',
	timestamp: Date.UTC(2022, 1, 17),
	method: async () => {
		const { highlightTheme } = await meta.settings.get('markdown');
		if (highlightTheme) {
			await meta.settings.setOne('markdown', 'highlightTheme', highlightTheme.replace('.min.css', '.css'));
		}
	},
};
