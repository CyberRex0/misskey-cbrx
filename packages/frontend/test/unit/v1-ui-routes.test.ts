/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, test } from 'vitest';
import { getV1NoteId, getV1SearchQuery, getV1UserAcct, getV1UserFollowRoute, isV1SupportedPath, normalizeV1Path } from '@/ui/v1/routes.js';

describe('v1 UI route support', () => {
	test('query and hash are ignored', () => {
		expect(normalizeV1Path('/search?q=misskey#result')).toBe('/search');
	});

	test.each([
		'/',
		'/timeline',
		'/@alice',
		'/@alice/followers',
		'/notes/123',
		'/my/drive/folder/123',
		'/chat/room/123',
		'/settings/security',
		'/reversi/g/123',
	])('supports %s', path => {
		expect(isV1SupportedPath(path)).toBe(true);
	});

	test.each([
		'/pages',
		'/play/123',
		'/channels/123',
		'/my/achievements',
		'/admin',
		'/settings/theme',
	])('rejects %s', path => {
		expect(isV1SupportedPath(path)).toBe(false);
	});
});

describe('getV1NoteId', () => {
	test('ノート詳細URLからIDを取り出す', () => {
		expect(getV1NoteId('/notes/9abc?ui=v1')).toBe('9abc');
	});

	test('ノート詳細以外ではnullを返す', () => {
		expect(getV1NoteId('/notes/9abc/reactions')).toBeNull();
		expect(getV1NoteId('/timeline')).toBeNull();
	});
});

describe('getV1SearchQuery', () => {
	test('検索URLからデコード済みのクエリを取り出す', () => {
		expect(getV1SearchQuery('/search?q=Misskey%20v1#result')).toBe('Misskey v1');
		expect(getV1SearchQuery('/search?q=%40alice%40example.com')).toBe('@alice@example.com');
	});

	test('検索ページ以外またはqなしでは空文字列を返す', () => {
		expect(getV1SearchQuery('/timeline?q=misskey')).toBe('');
		expect(getV1SearchQuery('/search')).toBe('');
	});
});

describe('getV1UserAcct', () => {
	test('ローカルおよびリモートのacctを取り出す', () => {
		expect(getV1UserAcct('/@alice')).toBe('alice');
		expect(getV1UserAcct('/@alice@example.com')).toBe('alice@example.com');
	});

	test('ユーザー配下の別ページではnullを返す', () => {
		expect(getV1UserAcct('/@alice/followers')).toBeNull();
	});
});

describe('getV1UserFollowRoute', () => {
	test('フォロー中およびフォロワーURLからacctと一覧種別を取り出す', () => {
		expect(getV1UserFollowRoute('/@alice/following')).toEqual({ acct: 'alice', type: 'following' });
		expect(getV1UserFollowRoute('/@alice%40example.com/followers?ui=v1')).toEqual({ acct: 'alice@example.com', type: 'followers' });
	});

	test('対象外のユーザー配下URLではnullを返す', () => {
		expect(getV1UserFollowRoute('/@alice')).toBeNull();
		expect(getV1UserFollowRoute('/@alice/notes')).toBeNull();
	});
});
