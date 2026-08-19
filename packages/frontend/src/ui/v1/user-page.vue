<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<section :class="$style.root">
	<MkLoading v-if="loading"/>
	<MkError v-else-if="error" @retry="fetchUser"/>
	<template v-else-if="user">
		<V1UserCard v-model:user="user"/>

		<nav :class="$style.tabs" :aria-label="i18n.ts.notes">
			<button
				v-for="item in tabs"
				:key="item.key"
				class="_button"
				:class="[$style.tab, { [$style.active]: tab === item.key }]"
				:aria-pressed="tab === item.key"
				@click="tab = item.key"
			>
				<i :class="item.icon"></i> {{ item.label }}
			</button>
		</nav>

		<MkNotesTimeline
			v-if="notesPaginator"
			:key="user.id"
			:paginator="notesPaginator"
			:noteComponent="V1Note"
			:noGap="true"
			:pullToRefresh="false"
		/>
	</template>
</section>
</template>

<script lang="ts" setup>
import { computed, markRaw, ref, shallowRef, watch } from 'vue';
import * as Misskey from 'misskey-js';
import V1Note from './note.vue';
import V1UserCard from './user-card.vue';
import type { IPaginator } from '@/utility/paginator.js';
import MkNotesTimeline from '@/components/MkNotesTimeline.vue';
import { acct as getAcct } from '@/filters/user.js';
import { i18n } from '@/i18n.js';
import { definePage } from '@/page.js';
import { Paginator } from '@/utility/paginator.js';
import { misskeyApi } from '@/utility/misskey-api.js';

type UserTimelineTab = 'all' | 'notes' | 'files';

const props = defineProps<{
	acct: string;
}>();

const user = ref<Misskey.entities.UserDetailed | null>(null);
const loading = ref(true);
const error = ref(false);
const tab = ref<UserTimelineTab>('all');
const notesPaginator = shallowRef<IPaginator<Misskey.entities.Note> | null>(null);
let fetchGeneration = 0;

const tabs: { key: UserTimelineTab; label: string; icon: string }[] = [{
	key: 'all',
	label: i18n.ts.all,
	icon: 'ti ti-pencil',
}, {
	key: 'notes',
	label: i18n.ts.notes,
	icon: 'ti ti-message',
}, {
	key: 'files',
	label: i18n.ts.withFiles,
	icon: 'ti ti-photo',
}];

async function fetchUser(): Promise<void> {
	const generation = ++fetchGeneration;
	loading.value = true;
	error.value = false;
	user.value = null;
	notesPaginator.value = null;
	const { username, host } = Misskey.acct.parse(props.acct);

	try {
		const result = await misskeyApi('users/show', { username, host });
		if (generation !== fetchGeneration) return;
		user.value = result;
		notesPaginator.value = markRaw(new Paginator('users/notes', {
			limit: 20,
			computedParams: computed(() => ({
				userId: result.id,
				withRenotes: tab.value === 'all',
				withReplies: tab.value === 'all',
				withChannelNotes: tab.value === 'all',
				withFiles: tab.value === 'files',
			})),
		}));
	} catch {
		if (generation === fetchGeneration) error.value = true;
	} finally {
		if (generation === fetchGeneration) loading.value = false;
	}
}

watch(() => props.acct, fetchUser, { immediate: true });

definePage(() => ({
	title: user.value?.name ?? user.value?.username ?? i18n.ts.user,
	icon: 'ti ti-user',
	...user.value ? {
		subtitle: `@${getAcct(user.value)}`,
		avatar: user.value,
		userName: user.value,
		path: `/@${getAcct(user.value)}`,
	} : {},
}));
</script>

<style lang="scss" module>
.root {
	min-height: 100%;
}

.tabs {
	position: sticky;
	top: 48px;
	z-index: 20;
	display: flex;
	height: 46px;
	background: color-mix(in srgb, var(--v1-panel) 94%, transparent);
	border-bottom: solid 1px var(--v1-divider);
	backdrop-filter: blur(8px);
}

.tab {
	position: relative;
	min-width: 92px;
	padding: 0 16px;
	font-size: 12px;
	color: var(--v1-muted);

	&.active {
		font-weight: 700;
		color: var(--v1-accent);

		&::after {
			position: absolute;
			left: 12px;
			right: 12px;
			bottom: 0;
			height: 3px;
			content: "";
			background: var(--v1-accent);
		}
	}
}

@container (max-width: 480px) {
	.tab {
		min-width: 0;
		flex: 1;
		padding: 0 8px;
	}
}
</style>
