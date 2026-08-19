<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<header :class="$style.root">
	<button
		class="_button"
		:class="$style.button"
		:aria-label="menuLabel"
		:aria-expanded="menuOpen"
		aria-controls="v1-mobile-navigation"
		@click="emit('openMenu')"
	>
		<i class="ti ti-menu-2" aria-hidden="true"></i>
		<i v-if="$i?.hasUnreadNotification || $i?.hasUnreadChatMessages" class="ti ti-circle-filled" :class="$style.indicator" aria-hidden="true"></i>
	</button>
	<h1 :class="$style.title">{{ title }}</h1>
	<button class="_button" :class="$style.button" :aria-label="i18n.ts.switchUi" @click="openUiSwitchMenu">
		<i class="ti ti-devices" aria-hidden="true"></i>
	</button>
	<button class="_button" :class="$style.button" :aria-label="i18n.ts.note" @click="os.post()">
		<i class="ti ti-pencil" aria-hidden="true"></i>
	</button>
</header>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { i18n } from '@/i18n.js';
import { $i } from '@/i.js';
import * as os from '@/os.js';
import { openUiSwitchMenu } from '@/ui/_common_/common.js';

defineProps<{
	title: string;
	menuOpen: boolean;
}>();

const emit = defineEmits<{
	(ev: 'openMenu'): void;
}>();

const menuLabel = computed(() => $i?.hasUnreadNotification || $i?.hasUnreadChatMessages
	? i18n.tsx._v1Ui.unreadLabel({ label: i18n.ts.menu })
	: i18n.ts.menu);
</script>

<style lang="scss" module>
.root {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	z-index: 1000;
	display: grid;
	grid-template-columns: 48px 1fr 48px 48px;
	height: 48px;
	color: var(--v1-mobileHeaderFg);
	background: var(--v1-mobileHeader);
	box-shadow: 0 1px 0 color-mix(in srgb, var(--v1-shadowColor) 8%, transparent);
}

.button {
	position: relative;
	font-size: 19px;
	color: inherit;
	border-right: solid 1px color-mix(in srgb, var(--v1-shadowColor) 10%, transparent);

	&:nth-last-child(2),
	&:last-child {
		border-right: 0;
		border-left: solid 1px color-mix(in srgb, var(--v1-shadowColor) 10%, transparent);
	}
}

.indicator {
	position: absolute;
	top: 8px;
	left: 8px;
	font-size: 9px;
	color: var(--v1-accent);
}

.title {
	margin: 0;
	overflow: hidden;
	font-size: 17px;
	font-weight: 400;
	line-height: 48px;
	text-align: center;
	text-overflow: ellipsis;
	white-space: nowrap;
}
</style>
