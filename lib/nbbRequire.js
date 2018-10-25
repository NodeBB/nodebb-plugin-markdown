var path = require('path');
var nconf = require.main.require('nconf');

module.exports = modulePath => {
	return require(path.join(nconf.get('base_dir'), modulePath));
};