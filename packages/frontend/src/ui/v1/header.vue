<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<header :class="$style.root">
	<div :class="$style.backdrop"></div>
	<div :class="$style.body">
		<nav :class="$style.nav" :aria-label="i18n.ts.menu">
			<MkA :class="$style.navItem" :activeClass="$style.active" to="/" exact>
				<i class="ti ti-home" aria-hidden="true"></i><span>{{ i18n.ts.timeline }}</span>
			</MkA>
			<MkA v-if="$i?.policies.chatAvailability !== 'unavailable'" :class="$style.navItem" :activeClass="$style.active" to="/chat" :aria-label="chatLabel">
				<i class="ti ti-messages" aria-hidden="true"></i><span>{{ i18n.ts.directMessage_short }}</span>
				<i v-if="$i?.hasUnreadChatMessages" class="ti ti-circle-filled" :class="$style.indicator" aria-hidden="true"></i>
			</MkA>
			<MkA :class="$style.navItem" :activeClass="$style.active" to="/reversi">
				<i class="ti ti-device-gamepad" aria-hidden="true"></i><span>{{ i18n.ts._reversi.reversi }}</span>
			</MkA>
		</nav>

		<div :class="$style.logo" aria-hidden="true">Misskey</div>

		<div :class="$style.actions">
			<form :class="$style.search" @submit.prevent="search">
				<i class="ti ti-search" aria-hidden="true"></i>
				<input v-model="query" type="search" :placeholder="i18n.ts.search" :aria-label="i18n.ts.search">
			</form>
			<button class="_button" :class="$style.iconButton" :aria-label="notificationsLabel" @click="mainRouter.push('/my/notifications')">
				<i class="ti ti-bell" aria-hidden="true"></i>
				<i v-if="$i?.hasUnreadNotification" class="ti ti-circle-filled" :class="$style.indicator" aria-hidden="true"></i>
			</button>
			<button class="_button" :class="$style.iconButton" :aria-label="i18n.ts.switchUi" @click="openUiSwitchMenu">
				<i class="ti ti-devices" aria-hidden="true"></i>
			</button>
			<button class="_button" :class="$style.account" @click="openAccountMenu">
				<span>{{ $i?.username }}</span>
				<MkAvatar v-if="$i" :class="$style.avatar" :user="$i"/>
			</button>
			<button class="_button" :class="$style.post" :aria-label="i18n.ts.note" @click="os.post()">
				<i class="ti ti-pencil" aria-hidden="true"></i>
			</button>
			<time :class="$style.clock" :datetime="now.toISOString()">
				<span>{{ dateText }}</span><strong>{{ timeText }}</strong>
			</time>
		</div>
	</div>
</header>
</template>

<script lang="ts" setup>
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { getAccountMenu } from '@/accounts.js';
import { i18n } from '@/i18n.js';
import { $i } from '@/i.js';
import * as os from '@/os.js';
import { mainRouter } from '@/router.js';
import { openUiSwitchMenu } from '@/ui/_common_/common.js';

defineOptions({
	name: 'V1Header',
});

const query = ref('');
const now = ref(new Date());
let clockTimer: number | undefined;

const dateText = computed(() => {
	const year = now.value.getFullYear();
	const month = String(now.value.getMonth() + 1).padStart(2, '0');
	const day = String(now.value.getDate()).padStart(2, '0');
	return `${year}/${month}/${day}`;
});
const timeText = computed(() => `${String(now.value.getHours()).padStart(2, '0')}:${String(now.value.getMinutes()).padStart(2, '0')}`);
const notificationsLabel = computed(() => $i?.hasUnreadNotification
	? i18n.tsx._v1Ui.unreadLabel({ label: i18n.ts.notifications })
	: i18n.ts.notifications);
const chatLabel = computed(() => $i?.hasUnreadChatMessages
	? i18n.tsx._v1Ui.unreadLabel({ label: i18n.ts.directMessage_short })
	: i18n.ts.directMessage_short);

function search() {
	const value = query.value.trim();
	if (value === '') return;
	mainRouter.push('/search', { query: { q: value } });
}

async function openAccountMenu(ev: PointerEvent) {
	const menu = await getAccountMenu({ withExtraOperation: true });
	os.popupMenu(menu, ev.currentTarget ?? ev.target);
}

onMounted(() => {
	clockTimer = window.setInterval(() => now.value = new Date(), 1000);
});

onUnmounted(() => {
	if (clockTimer !== undefined) window.clearInterval(clockTimer);
});
</script>

<style lang="scss" module>
.root {
	position: sticky;
	top: 0;
	z-index: 1000;
	height: 48px;
	box-shadow: 0 1px 1px color-mix(in srgb, var(--v1-shadowColor) 8%, transparent);
}

.backdrop {
	position: absolute;
	inset: 0;
	background: var(--v1-header);
}

.body {
	position: relative;
	display: flex;
	width: 100%;
	max-width: 1300px;
	height: 48px;
	margin: 0 auto;
	color: var(--v1-headerFg);
}

.nav,
.actions {
	display: flex;
	height: 48px;
	align-items: stretch;
}

.navItem {
	position: relative;
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 0 24px;
	font-size: 13px;
	font-variant: small-caps;
	color: var(--v1-headerFg);

	&:hover {
		color: var(--v1-headerFgHover);
		text-decoration: none;
	}

	&.active {
		border-bottom: solid 3px var(--v1-accent);
	}
}

.logo {
	position: absolute;
	left: 50%;
	top: 0;
	transform: translateX(-50%);
	line-height: 48px;
	font-weight: 700;
	font-size: 17px;
	letter-spacing: -1px;
	opacity: 0.24;
}

.actions {
	margin-left: auto;
}

.search {
	position: relative;
	display: flex;
	align-items: center;

	> i {
		position: absolute;
		left: 12px;
		pointer-events: none;
	}

	> input {
		box-sizing: border-box;
		width: 14em;
		height: 32px;
		padding: 6px 18px 6px 36px;
		color: var(--v1-fg);
		background: var(--v1-inputBg);
		border: 0;
		border-radius: 16px;
		outline: none;

		&:focus-visible {
			box-shadow: 0 0 0 2px color-mix(in srgb, var(--v1-accent) 50%, transparent);
		}
	}
}

.iconButton,
.account,
.post {
	position: relative;
	color: var(--v1-headerFg);
}

.iconButton {
	width: 38px;
	font-size: 18px;
}

.account {
	display: flex;
	align-items: center;
	gap: 12px;
	padding-left: 12px;
	font-weight: 700;
}

.avatar {
	width: 32px;
	height: 32px;
	margin-right: 6px;
	border-radius: 4px;
}

.post {
	width: 40px;
	height: 32px;
	margin: 8px;
	color: var(--v1-accentFg);
	background: var(--v1-accent);
	border-radius: 4px;
}

.clock {
	display: flex;
	flex-direction: column;
	justify-content: center;
	min-width: 66px;
	padding: 0 8px;
	text-align: center;
	font-size: 9px;

	> strong {
		font-size: 11px;
	}
}

.indicator {
	position: absolute;
	top: 7px;
	right: 5px;
	font-size: 8px;
	color: var(--v1-accent);
}

@media (max-width: 1100px) {
	.search {
		display: none;
	}

	.navItem {
		padding: 0 16px;

		> span {
			display: none;
		}
	}
}
</style>
