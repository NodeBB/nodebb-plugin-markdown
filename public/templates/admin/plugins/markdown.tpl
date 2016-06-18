<div class="row">
	<div class="col-lg-9">
		<form class="form markdown-settings">
			<div class="panel panel-default">
				<div class="panel-heading">Markdown</div>
				<div class="panel-body">
					<div class="row">
						<div class="col-lg-6">
							<div class="form-group">
								<label for="xhtmlOut">
									<input type="checkbox" name="xhtmlOut" id="xhtmlOut" />
									Use '/' to close single tags (<code>&lt;br /&gt;</code>)
								</label>
							</div>
							<div class="form-group">
								<label for="breaks">
									<input type="checkbox" name="breaks" id="breaks" />
									Treat newlines as single line breaks
								</label>
							</div>
							<div class="form-group">
								<label for="typographer">
									<input type="checkbox" name="typographer" id="typographer" />
									Enable smartypants and other sweet transforms (e.g. <code>(c)</code> &rarr; <code>&copy;</code>)
								</label>
							</div>
						</div>
						<div class="col-lg-6">
							<div class="form-group">
								<label for="linkify">
									<input type="checkbox" name="linkify" id="linkify" />
									Autoconvert url-like texts to links
								</label>
							</div>
							<div class="form-group">
								<label for="externalBlank">
									<input type="checkbox" name="externalBlank" id="externalBlank" />
									Open external links in a new tab/window
								</label>
							</div>
							<div class="form-group">
								<label for="nofollow">
									<input type="checkbox" name="nofollow" id="nofollow" />
									Tell web crawlers that external links are not to be followed
								</label>
							</div>
						</div>
					</div>
				</div>
			</div>
			<div class="row">
				<div class="col-sm-6">
					<div class="panel panel-default">
						<div class="panel-heading">Code Formatting</div>
						<div class="panel-body">
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
								<label for="langPrefix">
									Prefix for <code>code</code> blocks
								</label>
								<input class="form-control" placeholder="language-" type="text" name="langPrefix" id="langPrefix" />
							</div>
						</div>
					</div>
				</div>
				<div class="col-sm-6">
					<div class="panel panel-danger">
						<div class="panel-heading">Danger Zone</div>
						<div class="panel-body">
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
						</div>
					</div>
				</div>
			</div>
		</form>
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
<div class="row">
	<div class="panel panel-default">
		<div class="panel-heading">Markdown-it plugins</div>
			<ul class="plugins md-plugins">
					<!-- BEGIN mdPlugins -->
					<li id="{mdPlugins.name}" style="margin-left: 0;">
						<div class="pull-right">
							<button data-action="toggleActive" data-changed="0" class="btn
							<!-- IF mdPlugins.active --> btn-success
							<!-- ELSE --> btn-warning
							<!-- ENDIF mdPlugins.active -->
							"><i class="fa fa-power-off"></i>
							<!-- IF mdPlugins.active -->Deactivate
							<!-- ELSE -->Activate
							<!-- ENDIF mdPlugins.active -->
							</button>
							<button id="toggleInstall" class="btn
							<!-- IF mdPlugins.installed -->
							btn-danger"><i class="fa fa-trash-o"></i> Uninstall
							<!-- ELSE -->
							btn-success"><i class="fa fa-download"></i> Install
							<!-- ENDIF mdPlugins.installed -->
							</button>
						</div>
						<h2><strong>{mdPlugins.name}</strong></h2>
						<!-- IF mdPlugins.description -->
						<p>{mdPlugins.description}</p>
						<!-- ENDIF mdPlugins.description -->
						<!-- IF mdPlugins.url -->
						<p>For more information: <a target="_blank" href="{mdPlugins.url}">{mdPlugins.url}</a></p>
						<!-- ENDIF mdPlugins.url -->
					</li>
					<!-- END mdPlugins -->
			</ul>
		</div>
	</div>
</div>
