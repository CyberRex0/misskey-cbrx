/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { note as fakeNote, userLite } from '../../../.storybook/fakes.js';
import note_ from './note.vue';
import type { StoryObj } from '@storybook/vue3';

const decorator = () => ({
	template:
		'<div style="box-sizing: border-box; container-type: inline-size; width: min(680px, 100vw); color: var(--v1-fg); background: var(--v1-bg); --v1-bg: var(--MI_THEME-bg); --v1-panel: var(--MI_THEME-panel); --v1-fg: var(--MI_THEME-fg); --v1-muted: color-mix(in srgb, var(--MI_THEME-fg) 65%, transparent); --v1-divider: var(--MI_THEME-divider); --v1-subtleBg: var(--MI_THEME-buttonBg); --v1-accent: var(--MI_THEME-accent); --v1-accentFg: var(--MI_THEME-fgOnAccent);"><story/></div>',
});

const author = userLite('v1-story-user', 'miskist', null, 'Misskey User');
const baseNote = {
	...fakeNote('v1-story-note'),
	userId: author.id,
	user: author,
	text: 'Misskey v1 UIのノート表示です。 #Misskey',
	repliesCount: 3,
	renoteCount: 12,
	reactions: { '👍': 4 },
	reactionCount: 4,
};

export const Default = {
	render(args) {
		return {
			components: { note_ },
			setup() {
				return { args };
			},
			template: '<note_ v-bind="args"/>',
		};
	},
	args: {
		note: baseNote,
	},
	decorators: [decorator],
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof note_>;

export const Renote = {
	...Default,
	args: {
		note: {
			...fakeNote('v1-story-renote'),
			userId: author.id,
			user: author,
			text: null,
			renote: baseNote,
		},
	},
} satisfies StoryObj<typeof note_>;

export const Quote = {
	...Default,
	args: {
		note: {
			...baseNote,
			id: 'v1-story-quote',
			text: 'この投稿を引用します。',
			renote: {
				...fakeNote('v1-story-quote-target'),
				user: userLite('quoted-user', 'quoted', null, 'Quoted User'),
				text: '引用元のノートです。',
			},
		},
	},
} satisfies StoryObj<typeof note_>;
