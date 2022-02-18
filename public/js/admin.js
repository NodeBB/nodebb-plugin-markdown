'use strict';

/* globals define, $, socket, bootbox */

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
				highlightLinesLanguageList: [],
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
			Settings.save('markdown', $('.markdown-settings'), function () {
				alerts.alert({
					type: 'success',
					alert_id: 'markdown-saved',
					title: 'Reload Required',
					message: 'Please reload your NodeBB to have your changes take effect',
					clickfn: function () {
						socket.emit('admin.reload');
					},
				});
			});
		});

		// Warning for "html" option
		$('#html').on('change', function () {
			var inputEl = $(this);
			if (inputEl.prop('checked')) {
				bootbox.confirm('Are you sure you wish to disable sanitisation of HTML? <strong>Doing so compromises your forum&apos;s client-side security, and allows malicious users to execute arbitrary javascript on other users&apos; browsers.</strong>', function (result) {
					if (!result) {
						inputEl.prop('checked', false);
					}
				});
			}
		});
	};

	return Markdown;
});
