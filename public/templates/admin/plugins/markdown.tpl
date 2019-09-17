<div class="row">
	<div class="col-sm-2 col-xs-12 settings-header">General</div>
	<div class="col-sm-10 col-xs-12">
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
							<div class="form-group">
								<label for="allowRTLO">
									<input type="checkbox" name="allowRTLO" id="allowRTLO" />
									Allow RTL override unicode in link content
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

							<div class="form-group">
								<label for="highlightLinesLanguageList">
									Enable line numbers for the following languages
								</label>
								<select class="form-control" multiple="true" name="highlightLinesLanguageList" id="highlightLinesLanguageList" size="20">
									<option value="apache,apacheconf">Apache</option>
									<option value="bash,sh,zsh">Bash</option>
									<option value="cs,csharp">C#</option>
									<option value="cpp,c,cc,h,c++,h++,hpp">C++</option>
									<option value="css">CSS</option>
									<option value="coffeescript,coffee,cson,iced">CoffeeScript</option>
									<option value="diff,patch">Diff</option>
									<option value="xml,html,xhtml,rss,atom,xjb,xsd,xsl,plist">HTML</option>
									<option value="http,https">HTTP</option>
									<option value="ini,toml">Ini</option>
									<option value="json">JSON</option>
									<option value="java">Java</option>
									<option value="javascript,js,jsx">Javascript</option>
									<option value="makefile,mk,mak">Makefile</option>
									<option value="markdown,md,mkdown,mkd">Markdown</option>
									<option value="nginx,nginxconf">Nginx</option>
									<option value="objectivec,objc,obj-c">Objective C</option>
									<option value="php,php3,php4,php5,php6">PHP</option>
									<option value="perl,pl,pm">Perl</option>
									<option value="python,py,gyp">Python</option>
									<option value="ruby,rb,gemspec,podspec,thor,irb">Ruby</option>
									<option value="sql">SQL</option>
									<option value="shell,console">Shell</option>
								</select>
								<p class="help-block">
									You can use <code>ctrl</code> and <code>shift</code> to select/deselect multiple
									items and select/deselect items in ranges.
								</p>
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
</div>

<button id="save" class="floating-button mdl-button mdl-js-button mdl-button--fab mdl-js-ripple-effect mdl-button--colored">
	<i class="material-icons">save</i>
</button>