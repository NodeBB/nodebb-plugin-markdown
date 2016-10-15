"use strict";
/* global define, app, ajaxify, bootbox, socket */

define('admin/plugins/markdown', ['settings'], function(Settings) {
	var Markdown = {};

	Markdown.init = function() {
		// Set defaults
		Settings.load('markdown', $('.markdown-settings'), function(err, settings) {
				var defaults = ajaxify.data.defaults;
				for(var setting in defaults) {
					if (!settings.hasOwnProperty(setting)) {
						if (typeof defaults[setting] === 'boolean') {
							$('#' + setting).prop('checked', defaults[setting]);
						} else {
							$('#' + setting).val(defaults[setting]);
						}
					}
					// store initial activation state of plugin
					if (setting.startsWith('markdown-it-')) {
						var inputEl = $('#' + setting).children('h2').children('input');
						inputEl.prop('defaultChecked', inputEl.prop('checked'));
					}
				}
		});

		$('#save').on('click', function() {
			Settings.save('markdown', $('.markdown-settings'), function() {
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

		// Warning for activation of an uninstalled md-plugin
		$('[id^=markdown-it-]').on('change', function() {
		  var inputEl = $(this).find('input');
			var activated = inputEl.prop('checked');
		  var installed = $(this).find('button').data('installed');
		  if ((activated) && (installed === 0)) {
		    bootbox.alert('You must install the plugin in order to activate it.', function() {
		      inputEl.prop('checked', false);
		    });
		  }
		});

  // Install and uninstall md plugins on demand
	$('button[data-action="toggleInstall"]').click(function(event) {
		event.preventDefault();
		var btn = $(this);
		var pluginName = btn.parents('li')[0].id;
		var installed = btn.data("installed");
		if (installed === 0) {
			bootbox.confirm('Are you sure you want to install the plugin ' + pluginName, function(result) {
				if (result) {
					btn.html('<i class="fa fa-refresh fa-spin"></i> ' + 'Installing');
					btn.removeClass('btn-success').addClass('btn-warning');
					socket.emit('plugins.markdown.installMdPlugin', pluginName, function(err, callback) {
						if (err) {
							btn.html('<i class="fa fa-download"></i> ' + 'Install');
							btn.removeClass('btn-warning').addClass('btn-success');
							return app.alertError(err.message);
						}
						btn.data("installed", 1);
						btn.html('<i class="fa fa-trash-o"></i> ' + 'Uninstall');
						btn.removeClass('btn-warning').addClass('btn-danger');
						app.alert({
							type: 'success',
							alert_id: pluginName + 'installed',
							title: 'Reload Required',
							message: 'Please reload your NodeBB to have your changes take effect',
							clickfn: function() {
								socket.emit('admin.reload');
							}
						});
					});
				}
			});
		}
		else {
			var activated = btn.parent().next().children('input')[0].defaultChecked;
			if (activated) {
		    bootbox.alert('You need to deactivate the plugin and save settings in order to uninstall it.');
		  }
			else {
				bootbox.confirm('Are you sure you want to uninstall the plugin ' + pluginName, function(result) {
					if (result) {
						btn.html('<i class="fa fa-refresh fa-spin"></i> ' + 'Uninstalling');
						btn.removeClass('btn-danger').addClass('btn-warning');
						socket.emit('plugins.markdown.uninstallMdPlugin', pluginName, function(err, callback) {
							if (err) {
								btn.html('<i class="fa fa-trash-o"></i> ' + 'Uninstall');
								btn.removeClass('btn-warning').addClass('btn-danger');
								return app.alertError(err.message);
							}
							btn.data("installed", 0);
							btn.html('<i class="fa fa-download"></i> ' + 'Install');
							btn.removeClass('btn-warning').addClass('btn-success');
							app.alert({
								type: 'success',
								alert_id: pluginName + 'uninstalled',
								title: 'Restart Required',
								message: 'Please restart your NodeBB to have your changes take effect',
								clickfn: function() {
									socket.emit('admin.restart');
								}
							});
						});
					}
				});
			}
		}
	});
};
	return Markdown;
});
