/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

process.env.NODE_ENV = 'test';

import * as assert from 'node:assert';
import { beforeAll, beforeEach, describe, test } from 'vitest';
import { api, failedApiCall, signup } from '../utils.js';
import type * as misskey from 'misskey-js';

describe('users/common-followers', () => {
	let root: misskey.entities.SignupResponse;
	let viewer: misskey.entities.SignupResponse;
	let target: misskey.entities.SignupResponse;
	let commonFollowers: misskey.entities.SignupResponse[];
	let targetOnly: misskey.entities.SignupResponse;
	let viewerOnly: misskey.entities.SignupResponse;

	beforeAll(async () => {
		root = await signup({ username: 'root' });
		viewer = await signup({ username: 'viewer' });
		target = await signup({ username: 'target' });
		commonFollowers = await Promise.all([
			signup({ username: 'common1' }),
			signup({ username: 'common2' }),
			signup({ username: 'common3' }),
			signup({ username: 'common4' }),
		]);
		targetOnly = await signup({ username: 'targetonly' });
		viewerOnly = await signup({ username: 'vieweronly' });

		for (const user of [...commonFollowers, targetOnly]) {
			await api('following/create', { userId: target.id }, user);
		}
		for (const user of [...commonFollowers, viewerOnly]) {
			await api('following/create', { userId: user.id }, viewer);
		}
	}, 1000 * 60 * 2);

	beforeEach(async () => {
		await api('i/update', { followersVisibility: 'public' }, target);
	});

	test('対象のフォロワーと閲覧者のフォロー先の積集合だけを返す', async () => {
		const response = await api('users/common-followers', {
			userId: target.id,
			limit: 100,
		}, viewer);

		assert.strictEqual(response.status, 200);
		assert.deepStrictEqual(
			new Set(response.body.map(following => following.follower!.id)),
			new Set(commonFollowers.map(user => user.id)),
		);
		assert.ok(!response.body.some(following => following.follower!.id === targetOnly.id));
		assert.ok(!response.body.some(following => following.follower!.id === viewerOnly.id));
	});

	test('limitとuntilIdで欠落や重複なくページングできる', async () => {
		const firstPage = await api('users/common-followers', {
			userId: target.id,
			limit: 2,
		}, viewer);
		assert.strictEqual(firstPage.status, 200);
		assert.strictEqual(firstPage.body.length, 2);

		const secondPage = await api('users/common-followers', {
			userId: target.id,
			limit: 2,
			untilId: firstPage.body.at(-1)!.id,
		}, viewer);
		assert.strictEqual(secondPage.status, 200);
		assert.strictEqual(secondPage.body.length, 2);

		const combined = [...firstPage.body, ...secondPage.body];
		assert.strictEqual(new Set(combined.map(following => following.id)).size, 4);
		assert.deepStrictEqual(
			new Set(combined.map(following => following.follower!.id)),
			new Set(commonFollowers.map(user => user.id)),
		);
	});

	test('usernameとhostでも対象を指定できる', async () => {
		const response = await api('users/common-followers', {
			username: target.username,
			host: null,
			limit: 100,
		}, viewer);

		assert.strictEqual(response.status, 200);
		assert.deepStrictEqual(
			new Set(response.body.map(following => following.follower!.id)),
			new Set(commonFollowers.map(user => user.id)),
		);
	});

	test('匿名では利用できない', async () => {
		const response = await api('users/common-followers', {
			userId: target.id,
		});

		assert.strictEqual(response.status, 401);
	});

	test('存在しない対象ではNO_SUCH_USERを返す', async () => {
		await failedApiCall({
			endpoint: 'users/common-followers',
			parameters: { userId: '0000000000000000' },
			user: viewer,
		}, {
			status: 400,
			code: 'NO_SUCH_USER',
			id: 'edffd061-1d56-44bc-9c26-324d04ba1bad',
		});
	});

	test('followers公開では通常ユーザーも閲覧できる', async () => {
		await api('i/update', { followersVisibility: 'followers' }, target);

		await failedApiCall({
			endpoint: 'users/common-followers',
			parameters: { userId: target.id },
			user: viewer,
		}, {
			status: 400,
			code: 'FORBIDDEN',
			id: '0de9c230-3435-4c42-98a5-c80e8cd02f92',
		});

		await api('following/create', { userId: target.id }, viewer);
		const response = await api('users/common-followers', { userId: target.id }, viewer);
		assert.strictEqual(response.status, 200);
	});

	test('private公開は本人とモデレーターだけ閲覧できる', async () => {
		await api('i/update', { followersVisibility: 'private' }, target);

		await failedApiCall({
			endpoint: 'users/common-followers',
			parameters: { userId: target.id },
			user: viewer,
		}, {
			status: 400,
			code: 'FORBIDDEN',
			id: '0de9c230-3435-4c42-98a5-c80e8cd02f92',
		});

		const ownResponse = await api('users/common-followers', { userId: target.id }, target);
		assert.strictEqual(ownResponse.status, 200);

		const moderatorResponse = await api('users/common-followers', { userId: target.id }, root);
		assert.strictEqual(moderatorResponse.status, 200);
	});
});
