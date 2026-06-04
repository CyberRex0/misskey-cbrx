/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

process.env.NODE_ENV = 'test';

import { describe, test, expect } from 'vitest';
import { getValidator } from '../../../../../test/prelude/get-api-validator.js';
import { paramDef } from './ai-summary.js';

const VALID = true;
const INVALID = false;

describe('api:users/ai-summary', () => {
	describe('validation', () => {
		const v = getValidator(paramDef);

		test('Reject empty', () => expect(v({})).toBe(INVALID));
		test('Reject non-string userId', () => expect(v({ userId: 1 })).toBe(INVALID));
		test('Accept userId', () => expect(v({ userId: '1' })).toBe(VALID));
	});
});
