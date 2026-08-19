/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { userDetailed } from '../../../.storybook/fakes.js';
import user_card from './user-card.vue';
import type { StoryObj } from '@storybook/vue3';

const decorator = () => ({
	template:
		'<div style="box-sizing: border-box; container-type: inline-size; width: min(750px, 100vw); color: var(--v1-fg); background: var(--v1-bg); --v1-bg: var(--MI_THEME-bg); --v1-panel: var(--MI_THEME-panel); --v1-fg: var(--MI_THEME-fg); --v1-muted: color-mix(in srgb, var(--MI_THEME-fg) 65%, transparent); --v1-divider: var(--MI_THEME-divider); --v1-subtleBg: var(--MI_THEME-buttonBg); --v1-accent: var(--MI_THEME-accent); --v1-accentFg: var(--MI_THEME-fgOnAccent); --v1-shadow: 0 1px 4px color-mix(in srgb, var(--MI_THEME-fg) 18%, transparent);"><story/></div>',
});

export const Local = {
	render(args) {
		return {
			components: { user_card },
			setup() {
				return { args };
			},
			template: '<user_card v-bind="args"/>',
		};
	},
	args: {
		user: userDetailed('local-user', 'local', null, 'Local User'),
	},
	decorators: [decorator],
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof user_card>;

export const Remote = {
	...Local,
	args: {
		user: {
			...userDetailed('remote-user', 'remote', 'remote.example', 'Remote User'),
			isFollowed: true,
			url: 'https://remote.example/@remote',
		},
	},
} satisfies StoryObj<typeof user_card>;

export const Suspended = {
	...Local,
	args: {
		user: {
			...userDetailed('suspended-user', 'suspended', null, 'Suspended User'),
			isSuspended: true,
		},
	},
} satisfies StoryObj<typeof user_card>;
