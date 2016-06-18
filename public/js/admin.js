define('admin/plugins/markdown', ['settings'], function(Settings) {
	var Markdown = {};

	Markdown.init = function() {
		Settings.load('markdown', $('.markdown-settings'), function(err, settings) {
			var defaults = {
				'html': false,
				'xhtmlOut': true,
				'breaks': true,
				'langPrefix': 'language-',
				'linkify': true,
				'typographer': false,
				'highlight': true,
				'highlightTheme': 'railscasts.css',
				'externalBlank': false,
				'nofollow': true,
				// markdown-it-plugins
				'mdPlugins': [{name: 'markdown-it-sup',
												active: false,
												description: '<code>&lt;sup&gt;</code> tag for markdown-it markdown parser.',
												url: 'https://github.com/markdown-it/markdown-it-sup'},
												{name: 'markdown-it-sub',
												active: false,
												description: '<code>&lt;sub&gt;</code> tag for markdown-it markdown parser.',
												url: 'https://github.com/markdown-it/markdown-it-sub'}
											]
			};

			// Set defaults
			for(var setting in defaults) {
				if (!settings.hasOwnProperty(setting)) {
					if (typeof defaults[setting] === 'boolean') {
						$('#' + setting).prop('checked', defaults[setting]);
					} else {
						$('#' + setting).val(defaults[setting]);
					}
				}
			}
		});

		$('#save').on('click', function() {
			Settings.save('markdown', $('.markdown-settings'), function() {
				console.log($('.markdown-settings'));
				app.alert({
					type: 'success',
					alert_id: 'markdown-saved',
					title: 'Reload Required',
					message: 'Please reload your NodeBB to have your changes take effect',
					clickfn: function() {
						socket.emit('admin.reload');
					}
				});
			});
		});

		// Warning for "html" option
		$('#html').on('change', function() {
			var inputEl = $(this);
			if (inputEl.prop('checked')) {
				bootbox.confirm('Are you sure you wish to disable sanitisation of HTML? <strong>Doing so compromises your forum&apos;s client-side security, and allows malicious users to execute arbitrary javascript on other users&apos; browsers.</strong>', function(result) {
					if (!result) {
						inputEl.prop('checked', false);
					}
				});
			}
		});
	};

	$('button[data-action="toggleActive"]').click(function(event) {
		var btn = $(this);
		var pluginName = btn.parents('li')[0].id;
		var changed = btn.data("changed");
		changed = (changed + 1) % 2;
		console.log(btn.data());
		console.log(btn);
		//var btn = $('#' + pluginName + ' [data-action="toggleActive"]');
		btn.data("changed", changed);
		//btn.html('<i class="fa fa-power-off"></i> ' + (status.active ? 'Deactivate' : 'Activate'));
		//btn.toggleClass('btn-warning', status.active).toggleClass('btn-success', !status.active);
		btn.toggleClass('active', changed === 1);
	});

	$('#toggleInstall').click(function(event) {
    console.log("install clicked");
	});


	return Markdown;
});
