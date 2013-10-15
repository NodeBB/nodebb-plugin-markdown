<h1>Markdown</h1>

<h3>Parser Options</h3>

<form class="form">
	<div class="form-group">
		<label for="gfm">
			<input type="checkbox" data-field="nodebb-plugin-markdown:options:gfm" id="gfm" />
			Use <a href="http://github.github.com/github-flavored-markdown/">Github flavoured Markdown</a>
		</label>
	</div>
	<div class="form-group">
		<label for="highlight">
			<input type="checkbox" data-field="nodebb-plugin-markdown:options:highlight" id="highlight" />
			Automatically detect and highlight code blocks
		</label>
	</div>
	<div class="form-group">
		<label for="tables">
			<input type="checkbox" data-field="nodebb-plugin-markdown:options:tables" id="tables" />
			Parse <a href="https://github.com/adam-p/markdown-here/wiki/Markdown-Cheatsheet#wiki-tables">GFM Table Syntax</a>
		</label>
	</div>
	<div class="form-group">
		<label for="breaks">
			<input type="checkbox" data-field="nodebb-plugin-markdown:options:breaks" id="breaks" />
			Treat newlines as single line breaks
		</label>
	</div>
	<div class="form-group">
		<label for="pedantic">
			<input type="checkbox" data-field="nodebb-plugin-markdown:options:pedantic" id="pedantic" />
			Be as true to the Markdown specification as possible (in most cases, this is not required)
		</label>
	</div>
	<div class="form-group">
		<label for="sanitize">
			<input type="checkbox" data-field="nodebb-plugin-markdown:options:sanitize" id="sanitize" />
			Sanitize HTML
		</label>
		<div class="alert alert-warning">
			<strong><i class="icon-warning-sign"></i> Careful!</strong>
			<p>
				HTML sanitization is an important part of ensuring that your users
				do not run arbitrary javascript or alter parts of the page that were
				not meant to be altered. If this option is unchecked, make sure you
				are aware of the consequences!
			</p>
		</div>
	</div>
	<div class="form-group">
		<label for="smartLists">
			<input type="checkbox" data-field="nodebb-plugin-markdown:options:smartLists" id="smartLists" />
			Use smarter list behviour
		</label>
	</div>
	<div class="form-group">
		<label for="smartypants">
			<input type="checkbox" data-field="nodebb-plugin-markdown:options:smartypants" id="smartypants" />
			Use "smart" typograhic punctuation for things like quotes and dashes.
		</label>
	</div>
	<div class="form-group">
		<label for="langPrefix">
			Prefix for <code>code</code> blocks
		</label>
		<input class="form-control" placeholder="lang-" type="text" data-field="nodebb-plugin-markdown:options:langPrefix" id="langPrefix" />
	</div>

	<button class="btn btn-lg btn-primary" id="save">Save</button>
</form>

<script type="text/javascript">
	require(['forum/admin/settings'], function(Settings) {
		Settings.prepare();
	});
</script>