'use strict';

const privileges = require.main.require('./src/privileges');
const SocketPosts = require.main.require('./src/socket.io/posts');
const posts = require.main.require('./src/posts');

module.exports.checkbox = {
	edit: async function (socket, data) {
		const canEdit = await privileges.posts.canEdit(parseInt(data.pid, 10), socket.uid);
		if (!canEdit) {
			throw new Error('[[error:no-privileges]]');
		}

		let content = await posts.getPostField(data.pid, 'content');
		// Generate array of checkbox indices in the raw content
		const checkboxRegex = /\[[\sx]?\]/g;
		let match;
		const indices = [];
		// eslint-disable-next-line
		while ((match = checkboxRegex.exec(content)) !== null) {
			indices.push(match.index);
		}

		content = content.replace(checkboxRegex, function (match, idx) {
			if (idx !== indices[data.index]) {
				return match;
			}

			return data.state ? '[x]' : '[ ]';
		});

		await SocketPosts.edit(socket, {
			pid: data.pid,
			content: content,
		});
	},
};
