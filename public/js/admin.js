'use strict';

/* globals define, $, app, socket, bootbox */

define('admin/plugins/markdown', ['settings'], function (Settings) {
	var Markdown = {};

	Markdown.init = function () {
		Settings.load('markdown', $('.markdown-settings'), function (err, settings) {
			if (err) {
				settings = {};
			}

			var defaults = {
				html: false,
				xhtmlOut: true,
				breaks: true,
				langPrefix: 'language-',
				linkify: true,
				externalBlank: false,
				nofollow: true,
				typographer: false,
				highlight: true,
				highlightLines: false,
				highlightTheme: 'railscasts.css',
				allowRTLO: false,
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
				app.alert({
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
