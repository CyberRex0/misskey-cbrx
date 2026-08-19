<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<section :class="$style.root" :aria-label="list?.name ?? i18n.ts._widgets.userList">
	<header v-if="widgetProps.showHeader" :class="$style.header">
		<div :class="$style.title"><i class="ti ti-users" aria-hidden="true"></i> {{ list?.name ?? i18n.ts._widgets.userList }}</div>
		<button type="button" class="_button" :class="$style.settings" :aria-label="i18n.ts.settings" @click="configure">
			<i class="ti ti-settings" aria-hidden="true"></i>
		</button>
	</header>
	<div :class="$style.content">
		<div v-if="widgetProps.listId == null" :class="$style.init">
			<MkButton primary @click="chooseList">{{ i18n.ts._widgets._userList.chooseList }}</MkButton>
		</div>
		<MkLoading v-else-if="fetching"/>
		<div v-else :class="$style.users">
			<MkAvatar v-for="user in users" :key="user.id" :user="user" :class="$style.avatar" indicator link preview/>
		</div>
	</div>
</section>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { useInterval } from '@@/js/use-interval.js';
import type * as Misskey from 'misskey-js';
import type { FormWithDefault, GetFormResultType } from '@/utility/form.js';
import type { WidgetComponentEmits, WidgetComponentExpose, WidgetComponentProps } from '@/widgets/widget.js';
import MkButton from '@/components/MkButton.vue';
import { i18n } from '@/i18n.js';
import * as os from '@/os.js';
import { misskeyApi } from '@/utility/misskey-api.js';
import { useWidgetPropsManager } from '@/widgets/widget.js';

defineOptions({ name: 'V1UserListWidget' });

const name = 'userList';
const widgetPropsDef = {
	showHeader: { type: 'boolean', label: i18n.ts._widgetOptions.showHeader, default: true },
	listId: { type: 'string', default: null as string | null, required: false, hidden: true },
} satisfies FormWithDefault;
type WidgetProps = GetFormResultType<typeof widgetPropsDef>;

const props = defineProps<WidgetComponentProps<WidgetProps>>();
const emit = defineEmits<WidgetComponentEmits<WidgetProps>>();
const { widgetProps, configure, save } = useWidgetPropsManager(name, widgetPropsDef, props, emit);
const list = ref<Misskey.entities.UserList | null>(null);
const users = ref<Misskey.entities.UserDetailed[]>([]);
const fetching = ref(true);
const refreshing = ref(false);

async function chooseList(): Promise<void> {
	const lists = await misskeyApi('users/lists/list');
	const { canceled, result: listId } = await os.select({
		title: i18n.ts.selectList,
		items: lists.map(item => ({ value: item.id, label: item.name })),
		default: widgetProps.listId,
	});
	if (canceled) return;
	widgetProps.listId = listId;
	save();
	await fetchUsers();
}

async function fetchUsers(): Promise<void> {
	if (refreshing.value) return;
	if (widgetProps.listId == null) {
		fetching.value = false;
		return;
	}
	refreshing.value = true;
	try {
		const fetchedList = await misskeyApi('users/lists/show', { listId: widgetProps.listId });
		list.value = fetchedList;
		users.value = await misskeyApi('users/show', { userIds: fetchedList.userIds ?? [] });
	} finally {
		fetching.value = false;
		refreshing.value = false;
	}
}

useInterval(fetchUsers, 1000 * 60, { immediate: true, afterMounted: true });

defineExpose<WidgetComponentExpose>({
	name,
	configure,
	get id() { return props.widget?.id ?? null; },
});
</script>

<style lang="scss" module>
.root {
	overflow: hidden;
	background: var(--v1-panel, var(--MI_THEME-panel));
	border: solid 1px color-mix(in srgb, var(--v1-fg, var(--MI_THEME-fg)) 8%, transparent);
	border-radius: 6px;
}

.header {
	display: flex;
	align-items: center;
	height: 42px;
	border-bottom: solid 1px var(--v1-divider, var(--MI_THEME-divider));
}

.title {
	min-width: 0;
	flex: 1;
	padding: 0 16px;
	overflow: hidden;
	font-size: 0.9em;
	font-weight: bold;
	text-overflow: ellipsis;
	white-space: nowrap;

	> i { margin-right: 6px; }
}

.settings {
	display: grid;
	flex: 0 0 42px;
	align-self: stretch;
	place-items: center;
	color: var(--v1-muted, var(--MI_THEME-fg));

	&:hover, &:focus-visible { color: var(--v1-accent, var(--MI_THEME-accent)); }
	&:focus-visible { outline: solid 2px var(--MI_THEME-focus); outline-offset: -2px; }
}

.content { min-height: 72px; }
.init { padding: 16px; text-align: center; }
.users {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(30px, 40px));
	gap: 12px;
	place-content: center;
	padding: 16px;
}
.avatar { width: 100%; aspect-ratio: 1; }
</style>
