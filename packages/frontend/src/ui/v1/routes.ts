/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

const supportedV1Routes = [
	/^\/$/,
	/^\/timeline\/?$/,
	/^\/@[^/]+(?:\/(?:following|followers))?\/?$/,
	/^\/notes\/[^/]+(?:\/[^/]+)?\/?$/,
	/^\/search\/?$/,
	/^\/my\/(?:notifications|favorites)\/?$/,
	/^\/my\/drive(?:\/(?:folder|file)\/[^/]+)?\/?$/,
	/^\/my\/lists(?:\/[^/]+)?\/?$/,
	/^\/timeline\/list\/[^/]+\/?$/,
	/^\/chat(?:\/(?:user|room|messages)\/[^/]+)?\/?$/,
	/^\/reversi(?:\/g\/[^/]+)?\/?$/,
	/^\/settings(?:\/(?:profile|privacy|drive|notifications|security|mute-block|connect|apps))?\/?$/,
] as const;

export function normalizeV1Path(fullPath: string): string {
	const path = fullPath.split(/[?#]/, 1)[0];
	return path === '' ? '/' : path;
}

export function isV1SupportedPath(fullPath: string): boolean {
	const path = normalizeV1Path(fullPath);
	return supportedV1Routes.some(pattern => pattern.test(path));
}

export function getV1NoteId(fullPath: string): string | null {
	const match = normalizeV1Path(fullPath).match(/^\/notes\/([^/]+)$/);
	return match?.[1] ?? null;
}

export function getV1SearchQuery(fullPath: string): string {
	if (normalizeV1Path(fullPath) !== '/search') return '';
	const queryStart = fullPath.indexOf('?');
	if (queryStart === -1) return '';
	const query = fullPath.slice(queryStart + 1).split('#', 1)[0];
	return new URLSearchParams(query).get('q') ?? '';
}

export function getV1UserAcct(fullPath: string): string | null {
	const match = normalizeV1Path(fullPath).match(/^\/@([^/]+)$/);
	if (match?.[1] == null) return null;
	return decodeAcct(match[1]);
}

export type V1UserFollowRoute = {
	acct: string;
	type: 'following' | 'followers';
};

export function getV1UserFollowRoute(fullPath: string): V1UserFollowRoute | null {
	const match = normalizeV1Path(fullPath).match(/^\/@([^/]+)\/(following|followers)$/);
	if (match?.[1] == null || (match[2] !== 'following' && match[2] !== 'followers')) return null;
	return {
		acct: decodeAcct(match[1]),
		type: match[2],
	};
}

function decodeAcct(acct: string): string {
	try {
		return decodeURIComponent(acct);
	} catch {
		return acct;
	}
}
