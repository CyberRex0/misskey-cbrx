<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<Transition :enterActiveClass="$style.backdropActive" :leaveActiveClass="$style.backdropActive" :enterFromClass="$style.backdropFrom" :leaveToClass="$style.backdropFrom">
	<button v-if="model" class="_button" :class="$style.backdrop" :aria-label="i18n.ts.close" @click="model = false"></button>
</Transition>
<Transition :enterActiveClass="$style.drawerActive" :leaveActiveClass="$style.drawerActive" :enterFromClass="$style.drawerFrom" :leaveToClass="$style.drawerFrom">
	<aside
		v-if="model"
		id="v1-mobile-navigation"
		ref="drawer"
		:class="$style.drawer"
		role="dialog"
		aria-modal="true"
		:aria-label="i18n.ts.menu"
		tabindex="-1"
		@keydown="onKeydown"
	>
		<MkA v-if="$i" :class="$style.me" :to="`/@${$i.username}`" @click="model = false">
			<MkAvatar :class="$style.avatar" :user="$i"/>
			<div><MkUserName :user="$i"/><small><MkAcct :user="$i"/></small></div>
		</MkA>
		<nav :class="$style.links" :aria-label="i18n.ts.menu">
			<MkA v-for="item in items" :key="item.to" :to="item.to" :aria-label="item.ariaLabel ?? item.text" @click="model = false">
				<i :class="item.icon" aria-hidden="true"></i><span :class="$style.label">{{ item.text }}<span v-if="item.count" :class="$style.count">{{ item.count }}</span></span><i class="ti ti-chevron-right" aria-hidden="true"></i>
			</MkA>
		</nav>
	</aside>
</Transition>
</template>

<script lang="ts" setup>
import { computed, nextTick, onUnmounted, ref, watch } from 'vue';
import { i18n } from '@/i18n.js';
import { $i } from '@/i.js';

const model = defineModel<boolean>({ required: true });
const drawer = ref<HTMLElement>();
let previouslyFocusedElement: HTMLElement | null = null;

type NavigationItem = {
	to: string;
	icon: string;
	text: string;
	ariaLabel?: string;
	count?: string;
};

const items = computed<NavigationItem[]>(() => [
	{ to: '/', icon: 'ti ti-home', text: i18n.ts.timeline },
	{
		to: '/my/notifications',
		icon: 'ti ti-bell',
		text: i18n.ts.notifications,
		ariaLabel: $i?.hasUnreadNotification ? i18n.tsx._v1Ui.unreadCountLabel({ label: i18n.ts.notifications, count: $i.unreadNotificationsCount > 99 ? '99+' : String($i.unreadNotificationsCount) }) : i18n.ts.notifications,
		count: $i?.hasUnreadNotification ? ($i.unreadNotificationsCount > 99 ? '99+' : String($i.unreadNotificationsCount)) : undefined,
	},
	...($i?.policies.chatAvailability !== 'unavailable' ? [{ to: '/chat', icon: 'ti ti-messages', text: i18n.ts.directMessage_short }] : []),
	{ to: '/reversi', icon: 'ti ti-device-gamepad', text: i18n.ts._reversi.reversi },
	{ to: '/my/drive', icon: 'ti ti-cloud', text: i18n.ts.drive },
	{ to: '/my/favorites', icon: 'ti ti-star', text: i18n.ts.favorites },
	{ to: '/my/lists', icon: 'ti ti-list', text: i18n.ts.lists },
	{ to: '/search', icon: 'ti ti-search', text: i18n.ts.search },
	{ to: '/settings', icon: 'ti ti-settings', text: i18n.ts.settings },
]);

function onKeydown(ev: KeyboardEvent) {
	if (ev.key === 'Escape') {
		ev.preventDefault();
		model.value = false;
		return;
	}
	if (ev.key !== 'Tab' || drawer.value == null) return;

	const focusableElements = [...drawer.value.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])')];
	const first = focusableElements.at(0);
	const last = focusableElements.at(-1);
	if (first == null || last == null) {
		ev.preventDefault();
		return;
	}
	if (window.document.activeElement === drawer.value) {
		ev.preventDefault();
		(ev.shiftKey ? last : first).focus();
	} else if (ev.shiftKey && window.document.activeElement === first) {
		ev.preventDefault();
		last.focus();
	} else if (!ev.shiftKey && window.document.activeElement === last) {
		ev.preventDefault();
		first.focus();
	}
}

watch(model, async (showing) => {
	if (showing) {
		previouslyFocusedElement = window.document.activeElement instanceof HTMLElement ? window.document.activeElement : null;
		await nextTick();
		drawer.value?.focus();
	} else {
		previouslyFocusedElement?.focus();
		previouslyFocusedElement = null;
	}
}, { immediate: true });

onUnmounted(() => previouslyFocusedElement?.focus());
</script>

<style lang="scss" module>
.backdrop {
	position: fixed;
	inset: 0;
	z-index: 1100;
	width: 100%;
	height: 100%;
	background: color-mix(in srgb, var(--v1-shadowColor) 20%, transparent);
}

.drawer {
	position: fixed;
	top: 0;
	left: 0;
	z-index: 1101;
	box-sizing: border-box;
	width: 240px;
	height: 100dvh;
	overflow: auto;
	color: var(--v1-muted);
	background: var(--v1-panel);
}

.me {
	display: flex;
	align-items: center;
	gap: 16px;
	padding: 16px;
	color: var(--v1-muted);

	&:hover {
		text-decoration: none;
	}

	small {
		display: block;
		margin-top: 3px;
	}
}

.avatar {
	width: 64px;
	height: 64px;
}

.links {
	padding: 8px 0;
	border-top: solid 1px var(--v1-divider);

	> a {
		display: grid;
		grid-template-columns: 24px 1fr 20px;
		align-items: center;
		padding: 0 20px;
		line-height: 46px;
		color: var(--v1-muted);

		&:hover {
			color: var(--v1-accentFg);
			text-decoration: none;
			background: var(--v1-accent);
		}
	}
}

.label {
	display: flex;
	align-items: center;
	gap: 8px;
}

.count {
	min-width: 18px;
	padding: 1px 5px;
	font-size: 10px;
	font-weight: 700;
	line-height: 16px;
	text-align: center;
	color: var(--v1-accentFg);
	background: var(--v1-accent);
	border-radius: 9px;
}

.backdropActive {
	transition: opacity 300ms cubic-bezier(0.23, 1, 0.32, 1);
}

.backdropFrom {
	opacity: 0;
}

.drawerActive {
	transition: opacity 300ms cubic-bezier(0.23, 1, 0.32, 1), transform 300ms cubic-bezier(0.23, 1, 0.32, 1);
}

.drawerFrom {
	opacity: 0;
	transform: translateX(-240px);
}
</style>
