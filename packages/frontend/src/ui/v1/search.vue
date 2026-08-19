<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<section :class="$style.root">
	<form :class="$style.searchForm" @submit.prevent="search">
		<label :class="$style.inputLabel">
			<span>{{ i18n.ts.search }}</span>
			<span :class="$style.inputWrap">
				<i class="ti ti-search" aria-hidden="true"></i>
				<input v-model="searchQuery" type="search" autocomplete="off">
			</span>
		</label>
		<button class="_button" :class="$style.searchButton" :disabled="!canSearch" type="submit">{{ i18n.ts.search }}</button>
	</form>

	<nav :class="$style.tabs" :aria-label="i18n.ts.search">
		<button class="_button" :class="[$style.tab, { [$style.active]: tab === 'notes' }]" :aria-pressed="tab === 'notes'" @click="tab = 'notes'">
			<i class="ti ti-pencil" aria-hidden="true"></i> {{ i18n.ts.notes }}
		</button>
		<button class="_button" :class="[$style.tab, { [$style.active]: tab === 'users' }]" :aria-pressed="tab === 'users'" @click="tab = 'users'">
			<i class="ti ti-users" aria-hidden="true"></i> {{ i18n.ts.users }}
		</button>
	</nav>

	<div v-if="showOriginOptions" :class="$style.origins" role="group" :aria-label="i18n.ts.options">
		<button
			v-for="option in originOptions"
			:key="option.value"
			class="_button"
			:class="[$style.origin, { [$style.active]: origin === option.value }]"
			:aria-pressed="origin === option.value"
			@click="origin = option.value"
		>
			{{ option.label }}
		</button>
	</div>

	<MkInfo v-if="tab === 'notes' && !notesSearchAvailable" warn :class="$style.info">{{ i18n.ts.notesSearchNotAvailable }}</MkInfo>
	<MkInfo v-else-if="tab === 'users' && !usersSearchAvailable" warn :class="$style.info">{{ i18n.ts.usersSearchNotAvailable }}</MkInfo>

	<div v-else-if="activeQuery" :class="$style.results">
		<h2>{{ i18n.ts.searchResult }}: <span>{{ activeQuery }}</span></h2>
		<MkNotesTimeline
			v-if="tab === 'notes' && notePaginator"
			:paginator="notePaginator"
			:noteComponent="V1Note"
			:noGap="true"
			:pullToRefresh="false"
		/>
		<MkPagination v-else-if="tab === 'users' && userPaginator" v-slot="{ items }" :paginator="userPaginator" :pullToRefresh="false">
			<div :class="$style.users">
				<V1UserListItem v-for="user in extractDetailedUsers(items)" :key="user.id" :user="user"/>
			</div>
		</MkPagination>
	</div>
</section>
</template>

<script lang="ts" setup>
import { computed, markRaw, ref, shallowRef, watch } from 'vue';
import V1Note from './note.vue';
import V1UserListItem from './user-list-item.vue';
import type * as Misskey from 'misskey-js';
import MkInfo from '@/components/MkInfo.vue';
import MkNotesTimeline from '@/components/MkNotesTimeline.vue';
import MkPagination from '@/components/MkPagination.vue';
import { i18n } from '@/i18n.js';
import { instance } from '@/instance.js';
import { definePage } from '@/page.js';
import { mainRouter } from '@/router.js';
import { notesSearchAvailable, usersSearchAvailable } from '@/utility/check-permissions.js';
import { Paginator } from '@/utility/paginator.js';

defineOptions({
	name: 'V1Search',
});

type SearchTab = 'notes' | 'users';
type SearchOrigin = 'combined' | 'local' | 'remote';

const props = withDefaults(defineProps<{
	query?: string;
}>(), {
	query: '',
});

const tab = ref<SearchTab>('notes');
const origin = ref<SearchOrigin>('combined');
const searchQuery = ref('');
const activeQuery = ref('');
const notePaginator = shallowRef<Paginator<'notes/search'> | null>(null);
const userPaginator = shallowRef<Paginator<'users/search'> | null>(null);

const canSearch = computed(() => searchQuery.value.trim() !== '' && (tab.value === 'notes' ? notesSearchAvailable : usersSearchAvailable));
const noteSearchIsLocalOnly = computed(() => instance.federation === 'none' || instance.noteSearchableScope !== 'global');
const showOriginOptions = computed(() => instance.federation !== 'none' && (tab.value === 'users' || !noteSearchIsLocalOnly.value));
const originOptions = computed<{ value: SearchOrigin; label: string }[]>(() => {
	const options: { value: SearchOrigin; label: string }[] = [{ value: 'combined', label: i18n.ts.all }, { value: 'local', label: i18n.ts.local }];
	if (tab.value === 'users') options.push({ value: 'remote', label: i18n.ts.remote });
	return options;
});

function performSearch(): void {
	const query = searchQuery.value.trim();
	if (query === '' || !canSearch.value) return;
	activeQuery.value = query;

	if (tab.value === 'notes') {
		notePaginator.value = markRaw(new Paginator('notes/search', {
			limit: 20,
			params: {
				query,
				...(noteSearchIsLocalOnly.value || origin.value === 'local' ? { host: '.' } : {}),
			},
		}));
	} else {
		userPaginator.value = markRaw(new Paginator('users/search', {
			limit: 20,
			offsetMode: true,
			params: {
				query,
				origin: instance.federation === 'none' ? 'local' : origin.value,
				detail: true,
			},
		}));
	}
}

function extractDetailedUsers(users: Misskey.entities.User[]): Misskey.entities.UserDetailed[] {
	return users.filter((user): user is Misskey.entities.UserDetailed => 'createdAt' in user);
}

function search(): void {
	performSearch();
	if (activeQuery.value !== '') {
		mainRouter.push('/search', { query: { q: activeQuery.value } });
	}
}

watch(() => props.query, (query) => {
	if (query === activeQuery.value) return;
	searchQuery.value = query;
	performSearch();
}, { immediate: true });

watch(tab, () => {
	if (tab.value === 'notes' && origin.value === 'remote') origin.value = 'combined';
	search();
});

watch(origin, search);

definePage({
	title: i18n.ts.search,
	icon: 'ti ti-search',
});
</script>

<style lang="scss" module>
.root {
	min-height: 100%;
	background: var(--v1-bg);
}

.searchForm {
	display: flex;
	align-items: flex-end;
	gap: 10px;
	padding: 18px;
	background: var(--v1-panel);
}

.inputLabel {
	display: flex;
	flex: 1;
	flex-direction: column;
	gap: 6px;
	font-size: 12px;
	font-weight: 700;
	color: var(--v1-muted);
}

.inputWrap {
	position: relative;
	display: block;

	> i {
		position: absolute;
		left: 12px;
		top: 50%;
		transform: translateY(-50%);
		font-size: 16px;
	}

	> input {
		box-sizing: border-box;
		width: 100%;
		height: 40px;
		padding: 8px 12px 8px 38px;
		color: var(--v1-fg);
		background: var(--v1-inputBg);
		border: solid 1px var(--v1-divider);
		border-radius: 4px;

		&:focus-visible {
			outline: solid 2px color-mix(in srgb, var(--v1-accent) 55%, transparent);
			outline-offset: 1px;
		}
	}
}

.searchButton {
	height: 40px;
	padding: 0 22px;
	font-weight: 700;
	color: var(--v1-accentFg);
	background: var(--v1-accent);
	border-radius: 4px;

	&:disabled {
		opacity: 0.5;
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
	padding: 13px;
	font-size: 13px;
	color: var(--v1-muted);

	&.active {
		color: var(--v1-accent);
		box-shadow: inset 0 -2px 0 var(--v1-accent);
	}
}

.origins {
	display: flex;
	justify-content: center;
	gap: 5px;
	padding: 8px;
	background: var(--v1-panel);
	border-bottom: solid 1px var(--v1-divider);
}

.origin {
	padding: 6px 14px;
	font-size: 12px;
	color: var(--v1-muted);
	border-radius: 4px;

	&.active {
		font-weight: 700;
		color: var(--v1-accentFg);
		background: var(--v1-accent);
	}
}

.info {
	margin: 16px;
}

.results {
	> h2 {
		margin: 0;
		padding: 12px 16px;
		font-size: 12px;
		font-weight: 400;
		color: var(--v1-muted);

		span {
			font-weight: 700;
			color: var(--v1-fg);
		}
	}
}

.users {
	border-top: solid 1px var(--v1-divider);
}

@container (max-width: 480px) {
	.searchForm {
		align-items: stretch;
		flex-direction: column;
		padding: 12px 10px;
	}

	.searchButton {
		align-self: flex-end;
	}
}
</style>
