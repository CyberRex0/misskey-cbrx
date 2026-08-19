<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<section :class="$style.root">
	<MkLoading v-if="loading"/>
	<MkError v-else-if="error" @retry="fetchUser"/>
	<template v-else-if="user && paginator">
		<header :class="$style.header">
			<MkA :to="userPage(user)" :class="$style.user">
				<MkAvatar :class="$style.avatar" :user="user"/>
				<span :class="$style.userText">
					<strong><MkUserName :user="user"/></strong>
					<span><MkAcct :user="user"/></span>
				</span>
			</MkA>
		</header>

		<nav :class="$style.tabs" :aria-label="i18n.ts.profile">
			<MkA
				v-if="isFollowingVisibleForMe(user)"
				:to="`${userPage(user)}/following`"
				:class="[$style.tab, { [$style.active]: type === 'following' }]"
				:aria-current="type === 'following' ? 'page' : undefined"
			>
				{{ i18n.ts.following }} <span>{{ number(user.followingCount) }}</span>
			</MkA>
			<MkA
				v-if="isFollowersVisibleForMe(user)"
				:to="`${userPage(user)}/followers`"
				:class="[$style.tab, { [$style.active]: type === 'followers' }]"
				:aria-current="type === 'followers' ? 'page' : undefined"
			>
				{{ i18n.ts.followers }} <span>{{ number(user.followersCount) }}</span>
			</MkA>
		</nav>

		<nav v-if="showFollowerTabs" :class="$style.subTabs" :aria-label="i18n.ts.followers">
			<button class="_button" :class="[$style.subTab, { [$style.active]: followerTab === 'all' }]" :aria-pressed="followerTab === 'all'" @click="followerTab = 'all'">{{ i18n.ts.all }}</button>
			<button class="_button" :class="[$style.subTab, { [$style.active]: followerTab === 'commonFollowers' }]" :aria-pressed="followerTab === 'commonFollowers'" @click="followerTab = 'commonFollowers'">{{ i18n.ts.commonFollowers }}</button>
		</nav>

		<MkPagination v-slot="{ items }" :key="paginatorKey" :paginator="paginator" :pullToRefresh="false">
			<div :class="$style.users">
				<V1UserListItem
					v-for="listedUser in extractUsers(items)"
					:key="listedUser.id"
					:user="listedUser"
				/>
			</div>
		</MkPagination>
	</template>
</section>
</template>

<script lang="ts" setup>
import * as Misskey from 'misskey-js';
import { computed, markRaw, ref, shallowRef, watch } from 'vue';
import V1UserListItem from './user-list-item.vue';
import type { IPaginator } from '@/utility/paginator.js';
import MkPagination from '@/components/MkPagination.vue';
import { userPage } from '@/filters/user.js';
import number from '@/filters/number.js';
import { i18n } from '@/i18n.js';
import { $i } from '@/i.js';
import { definePage } from '@/page.js';
import { Paginator } from '@/utility/paginator.js';
import { isFollowersVisibleForMe, isFollowingVisibleForMe } from '@/utility/isFfVisibleForMe.js';
import { misskeyApi } from '@/utility/misskey-api.js';

type FollowListType = 'following' | 'followers';
type FollowerTab = 'all' | 'commonFollowers';
type FollowingRecord = Misskey.entities.Following;

const props = defineProps<{
	acct: string;
	type: FollowListType;
}>();

const user = ref<Misskey.entities.UserDetailed | null>(null);
const loading = ref(true);
const error = ref(false);
const followerTab = ref<FollowerTab>('all');
const paginator = shallowRef<IPaginator<FollowingRecord> | null>(null);
let fetchGeneration = 0;

const showFollowerTabs = computed(() => props.type === 'followers' && $i != null && user.value != null && $i.id !== user.value.id);
const paginatorKey = computed(() => `${user.value?.id}:${props.type}:${followerTab.value}`);

function createPaginator(userId: string): IPaginator<FollowingRecord> {
	const endpoint = props.type === 'following'
		? 'users/following'
		: followerTab.value === 'commonFollowers'
			? 'users/common-followers'
			: 'users/followers';
	return markRaw(new Paginator(endpoint, {
		limit: 20,
		params: { userId },
	}));
}

function extractUsers(items: FollowingRecord[]): Misskey.entities.UserDetailed[] {
	return items.flatMap((item) => {
		const listedUser = props.type === 'following' ? item.followee : item.follower;
		return listedUser == null ? [] : [listedUser];
	});
}

async function fetchUser(): Promise<void> {
	const generation = ++fetchGeneration;
	loading.value = true;
	error.value = false;
	user.value = null;
	paginator.value = null;
	const { username, host } = Misskey.acct.parse(props.acct);

	try {
		const result = await misskeyApi('users/show', { username, host });
		if (generation !== fetchGeneration) return;
		user.value = result;
		paginator.value = createPaginator(result.id);
	} catch {
		if (generation === fetchGeneration) error.value = true;
	} finally {
		if (generation === fetchGeneration) loading.value = false;
	}
}

watch(() => [props.acct, props.type] as const, () => {
	followerTab.value = 'all';
	void fetchUser();
}, { immediate: true });

watch(followerTab, () => {
	if (user.value != null) paginator.value = createPaginator(user.value.id);
});

definePage(() => ({
	title: user.value?.name ?? user.value?.username ?? i18n.ts.user,
	subtitle: props.type === 'following' ? i18n.ts.following : i18n.ts.followers,
	icon: 'ti ti-users',
	...user.value ? {
		avatar: user.value,
		userName: user.value,
		path: `${userPage(user.value)}/${props.type}`,
	} : {},
}));
</script>

<style lang="scss" module>
.root {
	min-height: 100%;
	background: var(--v1-bg);
}

.header {
	padding: 14px 16px;
	background: var(--v1-panel);
}

.user {
	display: inline-flex;
	align-items: center;
	gap: 10px;
	color: var(--v1-fg);

	&:hover {
		text-decoration: none;
	}
}

.avatar {
	width: 44px;
	height: 44px;
}

.userText {
	display: flex;
	flex-direction: column;
	min-width: 0;

	strong {
		overflow: hidden;
		font-size: 15px;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	span {
		font-size: 11px;
		color: var(--v1-muted);
	}
}

.tabs,
.subTabs {
	display: flex;
	background: var(--v1-panel);
	border-top: solid 1px var(--v1-divider);
	border-bottom: solid 1px var(--v1-divider);
}

.tab {
	flex: 1;
	padding: 13px 10px;
	font-size: 13px;
	text-align: center;
	color: var(--v1-muted);

	span {
		margin-left: 5px;
		font-weight: 700;
	}

	&:hover {
		text-decoration: none;
		background: var(--v1-subtleBg);
	}

	&.active {
		color: var(--v1-accent);
		box-shadow: inset 0 -2px 0 var(--v1-accent);
	}
}

.subTabs {
	justify-content: center;
	gap: 5px;
	padding: 8px;
	border-top: 0;
}

.subTab {
	padding: 6px 12px;
	font-size: 12px;
	color: var(--v1-muted);
	border-radius: 4px;

	&.active {
		font-weight: 700;
		color: var(--v1-accentFg);
		background: var(--v1-accent);
	}
}

.users {
	border-top: solid 1px var(--v1-divider);
}

@container (max-width: 480px) {
	.header {
		padding: 10px;
	}
}
</style>
