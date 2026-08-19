<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<section :class="$style.root">
	<header :class="$style.pageHeader">
		<button class="_button" :class="$style.back" :aria-label="i18n.ts.goBack" @click="goBack"><i class="ti ti-chevron-left"></i></button>
		<h2>{{ i18n.ts.note }}</h2>
		<button class="_button" :class="$style.reload" :aria-label="i18n.ts.reload" @click="fetchNote"><i class="ti ti-refresh"></i></button>
	</header>

	<MkLoading v-if="loading"/>
	<MkError v-else-if="error" @retry="fetchNote"/>
	<template v-else-if="note">
		<section v-if="conversation.length > 0" :class="$style.thread" :aria-label="i18n.ts._v1Ui.conversation">
			<V1Note v-for="item in conversation" :key="item.id" :note="item"/>
		</section>

		<div :class="$style.focused"><V1Note :note="note"/></div>

		<V1PostForm :reply="note" @posted="loadReplies"/>

		<section :class="$style.replies" :aria-label="i18n.ts.replies">
			<header :class="$style.sectionHeader"><i class="ti ti-arrow-back-up"></i> {{ i18n.ts.replies }}</header>
			<MkLoading v-if="repliesLoading" :class="$style.repliesLoading"/>
			<MkResult v-else-if="replies.length === 0" type="empty" :text="i18n.ts.noNotes"/>
			<V1Note v-for="item in replies" v-else :key="item.id" :note="item"/>
		</section>
	</template>
</section>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue';
import type * as Misskey from 'misskey-js';
import V1Note from './note.vue';
import V1PostForm from './post-form.vue';
import { dateString } from '@/filters/date.js';
import { i18n } from '@/i18n.js';
import { definePage } from '@/page.js';
import { misskeyApi } from '@/utility/misskey-api.js';

const props = defineProps<{
	noteId: string;
}>();

const note = ref<Misskey.entities.Note | null>(null);
const conversation = ref<Misskey.entities.Note[]>([]);
const replies = ref<Misskey.entities.Note[]>([]);
const loading = ref(true);
const repliesLoading = ref(false);
const error = ref(false);
let fetchGeneration = 0;

function goBack(): void {
	window.history.back();
}

async function loadReplies(): Promise<void> {
	const noteId = note.value?.id;
	if (noteId == null) return;
	repliesLoading.value = true;
	try {
		const result = await misskeyApi('notes/children', {
			noteId,
			limit: 30,
		});
		if (note.value?.id === noteId) replies.value = result;
	} catch {
		if (note.value?.id === noteId) replies.value = [];
	} finally {
		if (note.value?.id === noteId) repliesLoading.value = false;
	}
}

async function loadConversation(target: Misskey.entities.Note): Promise<void> {
	if (target.replyId == null) return;
	try {
		const result = await misskeyApi('notes/conversation', { noteId: target.replyId });
		if (note.value?.id === target.id) conversation.value = result.reverse();
	} catch {
		if (note.value?.id === target.id) conversation.value = [];
	}
}

async function fetchNote(): Promise<void> {
	const generation = ++fetchGeneration;
	loading.value = true;
	error.value = false;
	note.value = null;
	conversation.value = [];
	replies.value = [];

	let result: Misskey.entities.Note;
	try {
		result = await misskeyApi('notes/show', { noteId: props.noteId });
	} catch {
		if (generation !== fetchGeneration) return;
		error.value = true;
		loading.value = false;
		return;
	}

	if (generation !== fetchGeneration) return;
	note.value = result;
	loading.value = false;
	await Promise.all([loadConversation(result), loadReplies()]);
}

watch(() => props.noteId, fetchNote, { immediate: true });

definePage(() => ({
	title: i18n.ts.note,
	...note.value ? {
		subtitle: dateString(note.value.createdAt),
		avatar: note.value.user,
		path: `/notes/${note.value.id}`,
	} : {},
}));
</script>

<style lang="scss" module>
.root {
	min-height: 100%;
}

.pageHeader {
	position: sticky;
	top: 48px;
	z-index: 20;
	display: grid;
	grid-template-columns: 48px 1fr 48px;
	height: 48px;
	background: color-mix(in srgb, var(--v1-panel) 94%, transparent);
	border-bottom: solid 1px var(--v1-divider);
	backdrop-filter: blur(8px);

	h2 {
		margin: 0;
		font-size: 15px;
		line-height: 48px;
		text-align: center;
	}
}

.back,
.reload {
	font-size: 17px;
	color: var(--v1-muted);
}

.thread {
	opacity: 0.72;
}

.focused {
	position: relative;
	z-index: 1;
	box-shadow: 0 1px 4px color-mix(in srgb, var(--v1-shadowColor) 16%, transparent);

	article {
		border-left: solid 3px var(--v1-accent);
	}
}

.replies {
	border-top: solid 1px var(--v1-divider);
}

.sectionHeader {
	padding: 12px 18px;
	font-size: 13px;
	font-weight: 700;
	color: var(--v1-muted);
	background: var(--v1-subtleBg);
	border-bottom: solid 1px var(--v1-divider);
}

.repliesLoading {
	padding: 24px;
}
</style>
