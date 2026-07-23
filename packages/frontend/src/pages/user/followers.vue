<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader v-model:tab="tab" :actions="headerActions" :tabs="headerTabs">
	<div class="_spacer" style="--MI_SPACER-w: 1000px;">
		<Transition name="fade" mode="out-in">
			<div v-if="user" :key="`${user.id}:${tab}`">
				<XFollowList :user="user" :type="tab === 'commonFollowers' ? 'commonFollowers' : 'followers'"/>
			</div>
			<MkError v-else-if="error" @retry="fetchUser()"/>
			<MkLoading v-else/>
		</Transition>
	</div>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { computed, watch, ref } from 'vue';
import * as Misskey from 'misskey-js';
import XFollowList from './follow-list.vue';
import { misskeyApi } from '@/utility/misskey-api.js';
import { definePage } from '@/page.js';
import { i18n } from '@/i18n.js';
import { $i } from '@/i.js';

const props = withDefaults(defineProps<{
	acct: string;
}>(), {
});

const user = ref<null | Misskey.entities.UserDetailed>(null);
const error = ref<any>(null);
const tab = ref<'all' | 'commonFollowers'>('all');

function fetchUser(): void {
	if (props.acct == null) return;
	user.value = null;
	error.value = null;
	misskeyApi('users/show', Misskey.acct.parse(props.acct)).then(u => {
		user.value = u;
	}).catch(err => {
		error.value = err;
	});
}

watch(() => props.acct, () => {
	tab.value = 'all';
	fetchUser();
}, {
	immediate: true,
});

const headerActions = computed(() => []);

const headerTabs = computed(() => $i != null && user.value != null && $i.id !== user.value.id ? [{
	key: 'all',
	title: i18n.ts.all,
}, {
	key: 'commonFollowers',
	title: i18n.ts.commonFollowers,
}] : []);

definePage(() => ({
	title: i18n.ts.user,
	icon: 'ti ti-user',
	...user.value ? {
		title: user.value.name ? `${user.value.name} (@${user.value.username})` : `@${user.value.username}`,
		subtitle: i18n.ts.followers,
		userName: user.value,
		avatar: user.value,
	} : {},
}));
</script>
