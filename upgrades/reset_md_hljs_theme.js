'use strict';

const meta = require.main.require('./src/meta');
const markdown = require('..');

module.exports = {
	name: 'Reset Markdown Theme (if selected theme is not available)',
	timestamp: Date.UTC(2022, 0, 31),
	method: async () => {
		const { highlightTheme } = await meta.settings.get('markdown');
		if (highlightTheme) {
			await markdown.loadThemes();

			let newTheme = highlightTheme.replace('.css', '.min.css');
			if (!markdown.themes.includes(newTheme)) {
				newTheme = 'default.min.css';
			}

			await meta.settings.setOne('markdown', 'highlightTheme', newTheme);
		}
	},
};
