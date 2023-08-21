'use strict';

define('admin/plugins/markdown', ['settings', 'alerts'], function (Settings, alerts) {
	var Markdown = {};

	Markdown.init = function () {
		Settings.load('markdown', $('.markdown-settings'), function (err, settings) {
			if (err) {
				settings = {};
			}

			var defaults = {
				html: false,

				langPrefix: 'language-',
				highlight: true,
				highlightTheme: 'default.css',

				probe: true,
				probeCacheSize: 256,

				xhtmlOut: true,
				breaks: true,
				linkify: true,
				typographer: false,
				externalBlank: false,
				nofollow: true,
				allowRTLO: false,
				checkboxes: true,
				multimdTables: true,
			};

			// Set defaults
			for (var setting in defaults) {
				if (!settings.hasOwnProperty(setting)) {
					if (typeof defaults[setting] === 'boolean') {
						$('#' + setting).prop('checked', defaults[setting]);
					} else {
						$('#' + setting).val(defaults[setting]);
					}
				}
			}
		});

		$('#save').on('click', function () {
			Settings.save('markdown', $('.markdown-settings'));
		});
	};

	return Markdown;
});
