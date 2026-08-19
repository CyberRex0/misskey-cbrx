/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, test } from 'vitest';
import type * as Misskey from 'misskey-js';
import { createV1NotePresentation } from '@/ui/v1/note-model.js';

function note(overrides: Partial<Misskey.entities.Note> = {}): Misskey.entities.Note {
	return {
		id: 'note-id',
		text: null,
		cw: null,
		files: [],
		poll: null,
		renote: null,
		...overrides,
	} as Misskey.entities.Note;
}

describe('createV1NotePresentation', () => {
	test('通常ノートはそのまま表示する', () => {
		const input = note({ text: 'hello' });
		const result = createV1NotePresentation(input);

		expect(result.appearNote).toBe(input);
		expect(result.isPureRenote).toBe(false);
		expect(result.isQuote).toBe(false);
	});

	test('本文のないRenoteはRenote先を本文として表示する', () => {
		const target = note({ id: 'target', text: 'renoted' });
		const input = note({ renote: target });
		const result = createV1NotePresentation(input);

		expect(result.appearNote).toBe(target);
		expect(result.isPureRenote).toBe(true);
		expect(result.isQuote).toBe(false);
	});

	test('本文付きRenoteは引用として扱う', () => {
		const target = note({ id: 'target', text: 'quoted' });
		const input = note({ text: 'comment', renote: target });
		const result = createV1NotePresentation(input);

		expect(result.appearNote).toBe(input);
		expect(result.isPureRenote).toBe(false);
		expect(result.isQuote).toBe(true);
	});
});
