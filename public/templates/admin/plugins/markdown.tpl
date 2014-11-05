<div class="row">
	<div class="col-lg-9">
		<div class="panel panel-default">
			<div class="panel-heading">Markdown</div>
			<div class="panel-body">
				<form class="form markdown-settings">
					<div class="row">
						<div class="col-lg-4 col-md-6">
							<div class="form-group">
								<label for="xhtmlOut">
									<input type="checkbox" name="xhtmlOut" id="xhtmlOut" />
									Use '/' to close single tags (<code>&lt;br /&gt;</code>)
								</label>
							</div>
							<div class="form-group">
								<label for="highlight">
									<input type="checkbox" name="highlight" id="highlight" />
									Automatically detect and highlight code blocks
								</label>
							</div>
							<div class="form-group">
								<label for="highlightTheme">Use this theme for highlighted code blocks</label>
								<select class="form-control" name="highlightTheme" id="highlightTheme">
									<!-- BEGIN themes -->
									<option value="{themes.name}">{themes.name}</option>
									<!-- END themes -->
								</select>
							</div>
							<div class="form-group">
								<label for="breaks">
									<input type="checkbox" name="breaks" id="breaks" />
									Treat newlines as single line breaks
								</label>
							</div>
						</div>
						<div class="col-lg-4 col-md-6">
							<div class="form-group">
								<label for="html">
									<input type="checkbox" name="html" id="html" />
									Allow HTML
								</label>
								<div class="alert alert-warning">
									<strong><i class="icon-warning-sign"></i> Careful!</strong>
									<p>
										Automatic HTML sanitization is an important part of ensuring that
										your users do not run arbitrary javascript or alter parts of the
										page that were not meant to be altered. If this option is checked,
										beware the consequences!
									</p>
								</div>
							</div>
							<!-- <div class="form-group">
								<label for="noFollow">
									<input type="checkbox" name="noFollow" id="noFollow" />
									Instruct search engines to ignore off-site links (<code>rel=&quot;nofollow&quot;</code>)
								</label>
							</div> -->
						</div>
						<div class="col-lg-4 col-md-6">
							<div class="form-group">
								<label for="linkify">
									<input type="checkbox" name="linkify" id="linkify" />
									Autoconvert url-like texts to links
								</label>
							</div>
							<div class="form-group">
								<label for="typographer">
									<input type="checkbox" name="typographer" id="typographer" />
									Enable smartypants and other sweet transforms (e.g. <code>(c)</code> &rarr; <code>&copy;</code>)
								</label>
							</div>
							<div class="form-group">
								<label for="langPrefix">
									Prefix for <code>code</code> blocks
								</label>
								<input class="form-control" placeholder="language-" type="text" name="langPrefix" id="langPrefix" />
							</div>
						</div>
					</div>
				</form>
			</div>
		</div>
	</div>
	<div class="col-lg-3">
		<div class="panel panel-default">
			<div class="panel-heading">Markdown Control Panel</div>
			<div class="panel-body">
				<button class="btn btn-primary" id="save">Save Settings</button>
			</div>
		</div>
	</div>
</div>

<script type="text/javascript">
	require(['settings'], function(Settings) {
		Settings.load('markdown', $('.markdown-settings'), function(err, settings) {
			var defaults = {
				// 'gfm': true,
				// 'highlight': true,
				// 'tables': true,
				// 'breaks': true,
				// 'pedantic': false,
				// 'sanitize': true,
				// 'smartLists': true,
				// 'smartypants': false,
				// 'noFollow': true,
				// 'langPrefix': 'lang-',
				// 'headerPrefix': 'md-header-'
				'html': false,
				'xhtmlOut': true,
				'breaks': true,
				'langPrefix': 'language-',
				'linkify': true,
				'typographer': false,
				'highlight': true,
				'highlightTheme': 'railscasts.css'
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
				app.alert({
					type: 'success',
					alert_id: 'markdown-saved',
					title: 'Reload Required',
					message: 'Please reload your NodeBB to have your changes take effect',
					clickfn: function() {
						socket.emit('admin.reload');
					}
				})
			});
		});
	});
</script>
