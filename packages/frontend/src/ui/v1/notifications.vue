<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<section :class="$style.root">
	<header :class="$style.pageHeader">
		<h1>{{ i18n.ts.notifications }}</h1>
		<span v-if="$i?.unreadNotificationsCount" :class="$style.unread">{{ unreadCount }}</span>
		<div :class="$style.actions">
			<button v-if="tab === 'all'" type="button" class="_button" :class="[$style.action, { [$style.active]: includeTypes != null }]" :aria-pressed="includeTypes != null" @click="setFilter">
				<i class="ti ti-filter" aria-hidden="true"></i> {{ i18n.ts.filter }}
			</button>
			<button v-if="tab === 'all'" type="button" class="_button" :class="$style.action" @click="markAllAsRead">
				<i class="ti ti-check" aria-hidden="true"></i> {{ i18n.ts.markAllAsRead }}
			</button>
		</div>
	</header>

	<nav :class="$style.tabs" :aria-label="i18n.ts.notifications">
		<button v-for="item in tabs" :key="item.key" type="button" class="_button" :class="[$style.tab, { [$style.active]: tab === item.key }]" :aria-pressed="tab === item.key" @click="tab = item.key">
			<i :class="item.icon" aria-hidden="true"></i> {{ item.label }}
		</button>
	</nav>

	<MkStreamingNotificationsTimeline
		v-if="tab === 'all'"
		:excludeTypes="excludeTypes"
		:notificationComponent="V1Notification"
		:noteComponent="V1Note"
	/>
	<MkNotesTimeline v-else-if="tab === 'mentions'" :paginator="mentionsPaginator" :noteComponent="V1Note" :noGap="true" :pullToRefresh="false"/>
	<MkNotesTimeline v-else :paginator="directNotesPaginator" :noteComponent="V1Note" :noGap="true" :pullToRefresh="false"/>
</section>
</template>

<script lang="ts" setup>
import { computed, markRaw, ref } from 'vue';
import { notificationTypes } from 'misskey-js';
import V1Note from './note.vue';
import V1Notification from './notification.vue';
import { updateCurrentAccountPartial } from '@/accounts.js';
import MkNotesTimeline from '@/components/MkNotesTimeline.vue';
import MkStreamingNotificationsTimeline from '@/components/MkStreamingNotificationsTimeline.vue';
import { i18n } from '@/i18n.js';
import { $i } from '@/i.js';
import * as os from '@/os.js';
import { definePage } from '@/page.js';
import { Paginator } from '@/utility/paginator.js';

defineOptions({
	name: 'V1Notifications',
});

type NotificationTab = 'all' | 'mentions' | 'directNotes';
type NotificationType = typeof notificationTypes[number];

const tab = ref<NotificationTab>('all');
const includeTypes = ref<NotificationType[] | null>(null);
const excludeTypes = computed(() => includeTypes.value == null ? null : notificationTypes.filter(type => !includeTypes.value?.includes(type)));
const unreadCount = computed(() => ($i?.unreadNotificationsCount ?? 0) > 99 ? '99+' : String($i?.unreadNotificationsCount ?? 0));

const tabs: { key: NotificationTab; label: string; icon: string }[] = [
	{ key: 'all', label: i18n.ts.all, icon: 'ti ti-point' },
	{ key: 'mentions', label: i18n.ts.mentions, icon: 'ti ti-at' },
	{ key: 'directNotes', label: i18n.ts.directNotes, icon: 'ti ti-mail' },
];

const mentionsPaginator = markRaw(new Paginator('notes/mentions', {
	limit: 20,
}));

const directNotesPaginator = markRaw(new Paginator('notes/mentions', {
	limit: 20,
	params: { visibility: 'specified' },
}));

function setFilter(ev: PointerEvent): void {
	const typeItems = notificationTypes.map(type => ({
		text: i18n.ts._notification._types[type],
		active: includeTypes.value?.includes(type) ?? false,
		action: () => includeTypes.value = [type],
	}));
	const items = includeTypes.value == null ? typeItems : [{
		icon: 'ti ti-x',
		text: i18n.ts.clear,
		action: () => includeTypes.value = null,
	}, { type: 'divider' as const }, ...typeItems];
	os.popupMenu(items, ev.currentTarget ?? ev.target);
}

async function markAllAsRead(): Promise<void> {
	await os.apiWithDialog('notifications/mark-all-as-read', {});
	updateCurrentAccountPartial({
		hasUnreadNotification: false,
		unreadNotificationsCount: 0,
	});
}

definePage({
	title: i18n.ts.notifications,
	icon: 'ti ti-bell',
});
</script>

<style lang="scss" module>
.root {
	min-height: 100%;
	background: var(--v1-bg);
}

.pageHeader {
	display: flex;
	align-items: center;
	gap: 9px;
	min-height: 52px;
	padding: 0 14px;
	background: var(--v1-panel);

	h1 {
		margin: 0;
		font-size: 16px;
	}
}

.unread {
	min-width: 18px;
	padding: 2px 5px;
	font-size: 10px;
	font-weight: 700;
	text-align: center;
	color: var(--v1-accentFg);
	background: var(--v1-accent);
	border-radius: 9px;
}

.actions {
	display: flex;
	gap: 5px;
	margin-left: auto;
}

.action {
	padding: 7px 9px;
	font-size: 11px;
	color: var(--v1-muted);
	background: var(--v1-subtleBg);
	border-radius: 4px;

	&.active {
		color: var(--v1-accent);
	}
}

.tabs {
	display: flex;
	background: var(--v1-panel);
	border-top: solid 1px var(--v1-divider);
	border-bottom: solid 1px var(--v1-divider);
}

.tab {
	flex: 1;
	padding: 12px 8px;
	font-size: 12px;
	color: var(--v1-muted);

	&.active {
		color: var(--v1-accent);
		box-shadow: inset 0 -2px 0 var(--v1-accent);
	}
}

@container (max-width: 560px) {
	.pageHeader {
		align-items: flex-start;
		flex-wrap: wrap;
		padding: 10px;

		h1 {
		line-height: 30px;
	}
	}

	.actions {
		width: 100%;
		margin-left: 0;
	}

	.action {
		flex: 1;
	}
}
</style>
