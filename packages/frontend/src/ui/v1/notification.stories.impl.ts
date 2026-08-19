/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { note as fakeNote, userLite } from '../../../.storybook/fakes.js';
import notification_ from './notification.vue';
import type { StoryObj } from '@storybook/vue3';
import type * as Misskey from 'misskey-js';

const decorator = () => ({
	template:
		'<div style="box-sizing: border-box; container-type: inline-size; width: min(680px, 100vw); color: var(--v1-fg); background: var(--v1-bg); --v1-bg: var(--MI_THEME-bg); --v1-panel: var(--MI_THEME-panel); --v1-fg: var(--MI_THEME-fg); --v1-muted: color-mix(in srgb, var(--MI_THEME-fg) 65%, transparent); --v1-divider: var(--MI_THEME-divider); --v1-subtleBg: var(--MI_THEME-buttonBg); --v1-accent: var(--MI_THEME-accent); --v1-accentFg: var(--MI_THEME-fgOnAccent);"><story/></div>',
});

const actor = userLite(
	'notification-user',
	'notify',
	null,
	'Notification User',
);
const targetNote = {
	...fakeNote('notification-note'),
	text: 'リアクションされたノートです。',
};

export const Reaction = {
	render(args) {
		return {
			components: { notification_ },
			setup() {
				return { args };
			},
			template: '<notification_ v-bind="args"/>',
		};
	},
	args: {
		notification: {
			id: 'reaction-notification',
			createdAt: '2026-08-19T10:00:00.000Z',
			type: 'reaction',
			user: actor,
			userId: actor.id,
			note: targetNote,
			reaction: '👍',
		} as Misskey.entities.Notification,
	},
	decorators: [decorator],
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof notification_>;

export const FollowRequest = {
	...Reaction,
	args: {
		notification: {
			id: 'follow-request-notification',
			createdAt: '2026-08-19T10:00:00.000Z',
			type: 'receiveFollowRequest',
			user: actor,
			userId: actor.id,
		} as Misskey.entities.Notification,
	},
} satisfies StoryObj<typeof notification_>;

export const App = {
	...Reaction,
	args: {
		notification: {
			id: 'app-notification',
			createdAt: '2026-08-19T10:00:00.000Z',
			type: 'app',
			header: 'アプリ通知',
			body: 'アプリから届いた通知の本文です。',
			icon: null,
		} as Misskey.entities.Notification,
	},
} satisfies StoryObj<typeof notification_>;
