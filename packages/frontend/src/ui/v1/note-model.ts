/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type * as Misskey from 'misskey-js';

export type V1NotePresentation = {
	note: Misskey.entities.Note;
	appearNote: Misskey.entities.Note;
	isPureRenote: boolean;
	isQuote: boolean;
};

export function createV1NotePresentation(note: Misskey.entities.Note): V1NotePresentation {
	const hasOwnContent = note.text != null || note.cw != null || (note.files?.length ?? 0) > 0 || note.poll != null;
	const isPureRenote = note.renote != null && !hasOwnContent;

	return {
		note,
		appearNote: isPureRenote && note.renote != null ? note.renote : note,
		isPureRenote,
		isQuote: note.renote != null && hasOwnContent,
	};
}
