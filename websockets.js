// Source https://github.com/NodeBB/nodebb-plugin-friends/blob/master/lib/websockets.js
var winston = require('winston');
var meta = require.main.require('./src/meta');
var sockets = require.main.require('./src/socket.io/plugins');

sockets.markdown = {};

sockets.markdown.installMdPlugin = function(socket, pluginName, callback) {
  "use strict";
  require('child_process').exec('npm install ' + pluginName, function(err, stdout) {
    if (err) {
      return callback(err);
    }
    winston.info('[nodebb-plugin-markdown] installed succesfully ' + pluginName + '\n' + stdout);
    meta.reloadRequired = true;
  });
  callback(null);
};

sockets.markdown.uninstallMdPlugin = function(socket, pluginName, callback) {
  "use strict";
  require('child_process').exec('npm uninstall ' + pluginName, function(err, stdout) {
    if (err) {
      return callback(err);
    }
    winston.info('[nodebb-plugin-markdown] uninstalled succesfully ' + pluginName + '\n' + stdout);
  });
  meta.reloadRequired = true;
  callback(null);
};

module.exports = sockets.markdown;
