'use strict';

var async = require('async');
var privileges = require.main.require('./src/privileges');
var SocketPosts = require.main.require('./src/socket.io/posts');
var posts = require.main.require('./src/posts');

module.exports.checkbox = {
	edit: function (socket, data, callback) {
		async.waterfall([
			async.apply(privileges.posts.canEdit, parseInt(data.pid, 10), socket.uid),
			function (canEdit, next) {
				if (!canEdit) {
					return next(new Error('[[error:no-privileges]]'));
				}

				posts.getPostField(data.pid, 'content', next);
			},
			function (content, next) {
				// Generate array of checkbox indices in the raw content
				var checkboxRegex = /\[[\sx]?\]/g;
				var match;
				var indices = [];
				while ((match = checkboxRegex.exec(content)) !== null) {
					indices.push(match.index);
				}

				next(null, content, indices);
			},
			function (content, indices, next) {
				var checkboxRegex = /\[[\sx]?\]/g;
				content = content.replace(checkboxRegex, function (match, idx) {
					if (idx !== indices[data.index]) {
						return match;
					}

					return data.state ? '[x]' : '[ ]';
				});

				next(null, content);
			},
			function (content, next) {
				SocketPosts.edit(socket, {
					pid: data.pid,
					content: content,
				}, next);
			},
		], function (err) {
			if (err) {
				return callback(err, false);
			}

			callback(err, true);
		});
	},
};
