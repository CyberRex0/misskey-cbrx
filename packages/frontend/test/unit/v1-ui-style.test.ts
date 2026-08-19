/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, test } from 'vitest';
import { resolveUiStyle } from '@/boot/ui-style.js';

function resolve(overrides: Partial<Parameters<typeof resolveUiStyle>[0]> = {}) {
	return resolveUiStyle({
		storedUiStyle: 'default',
		isSignedIn: true,
		searchParams: new URLSearchParams(),
		pathname: '/',
		useSimpleDeckUiForNonRootPages: false,
		...overrides,
	});
}

describe('resolveUiStyle', () => {
	test('ログイン中は保存済みのv1 UIを維持する', () => {
		expect(resolve({ storedUiStyle: 'v1' })).toBe('v1');
	});

	test('ログイン中はURLのv1指定を優先する', () => {
		expect(resolve({
			storedUiStyle: 'default',
			searchParams: new URLSearchParams('ui=v1'),
		})).toBe('v1');
	});

	test('未ログイン時は保存済みのv1 UIからvisitor UIへフォールバックする', () => {
		expect(resolve({
			storedUiStyle: 'v1',
			isSignedIn: false,
		})).toBe('visitor');
	});

	test('未ログイン時はURLのv1指定からもvisitor UIへフォールバックする', () => {
		expect(resolve({
			isSignedIn: false,
			searchParams: new URLSearchParams('ui=v1'),
		})).toBe('visitor');
	});

	test('zen指定とDeckの簡易UI解決を維持する', () => {
		expect(resolve({ searchParams: new URLSearchParams('zen') })).toBe('zen');
		expect(resolve({
			storedUiStyle: 'deck',
			pathname: '/search',
			useSimpleDeckUiForNonRootPages: true,
		})).toBe('zen');
	});

	test('uiクエリはzen指定より優先される', () => {
		expect(resolve({ searchParams: new URLSearchParams('zen&ui=v1') })).toBe('v1');
	});
});
