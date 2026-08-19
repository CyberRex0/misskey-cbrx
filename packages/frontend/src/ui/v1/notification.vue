<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<article :class="$style.root">
	<div :class="$style.iconArea">
		<MkAvatar v-if="actor" :class="$style.avatar" :user="actor" link preview/>
		<div v-else :class="$style.icon"><i :class="iconClass" aria-hidden="true"></i></div>
	</div>
	<div :class="$style.body">
		<header :class="$style.header">
			<div :class="$style.title">
				<MkA v-if="actor" :to="userPage(actor)" :class="$style.actor"><MkUserName :user="actor"/></MkA>
				<span>{{ eventText }}</span>
			</div>
			<MkTime :time="notification.createdAt" :class="$style.time"/>
		</header>

		<MkA v-if="targetPath && detail" :to="targetPath" :class="$style.detail">
			<MkReactionIcon v-if="notification.type === 'reaction'" :reaction="notification.reaction" :noStyle="true" :class="$style.reaction"/>
			<Mfm :text="detail" :plain="true" :nowrap="true" :author="noteAuthor"/>
		</MkA>
		<div v-else-if="detail" :class="$style.detail">
			<Mfm :text="detail" :plain="notification.type !== 'app'" :nowrap="notification.type !== 'app'" :author="noteAuthor"/>
		</div>

		<div v-if="notification.type === 'receiveFollowRequest' && !requestHandled" :class="$style.actions">
			<button type="button" class="_button" :class="[$style.action, $style.primary]" @click="acceptFollowRequest"><i class="ti ti-check" aria-hidden="true"></i> {{ i18n.ts.accept }}</button>
			<button type="button" class="_button" :class="$style.action" @click="rejectFollowRequest"><i class="ti ti-x" aria-hidden="true"></i> {{ i18n.ts.reject }}</button>
		</div>
	</div>
</article>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import type * as Misskey from 'misskey-js';
import MkReactionIcon from '@/components/MkReactionIcon.vue';
import { notePage } from '@/filters/note.js';
import { userPage } from '@/filters/user.js';
import { i18n } from '@/i18n.js';
import * as os from '@/os.js';
import { getNoteSummary } from '@/utility/get-note-summary.js';

defineOptions({
	name: 'V1Notification',
});

const props = withDefaults(defineProps<{
	notification: Misskey.entities.Notification;
	withTime?: boolean;
	full?: boolean;
}>(), {
	withTime: true,
	full: true,
});

const requestHandled = ref(false);

const actor = computed<Misskey.entities.UserLite | null>(() => {
	if ('user' in props.notification) return props.notification.user;
	if (props.notification.type === 'reaction:grouped') return props.notification.reactions[0]?.user ?? null;
	if (props.notification.type === 'renote:grouped') return props.notification.users[0] ?? null;
	return null;
});

const noteAuthor = computed(() => 'note' in props.notification ? props.notification.note.user : undefined);

const eventText = computed(() => {
	if (props.notification.type === 'app') return props.notification.header ?? i18n.ts._notification._types.app;
	if (props.notification.type === 'reaction:grouped') {
		const count = new Set(props.notification.reactions.map(reaction => reaction.user.id)).size;
		return props.notification.note.reactionAcceptance === 'likeOnly'
			? i18n.tsx._notification.likedBySomeUsers({ n: count })
			: i18n.tsx._notification.reactedBySomeUsers({ n: count });
	}
	if (props.notification.type === 'renote:grouped') return i18n.tsx._notification.renotedBySomeUsers({ n: props.notification.users.length });
	return i18n.ts._notification._types[props.notification.type];
});

const detail = computed<string | null>(() => {
	if ('note' in props.notification) return getNoteSummary(props.notification.note);
	if (props.notification.type === 'scheduledNotePostFailed') return props.notification.noteDraft.text;
	if (props.notification.type === 'roleAssigned') return props.notification.role.name;
	if (props.notification.type === 'chatRoomInvitationReceived') return props.notification.invitation.room.name;
	if (props.notification.type === 'achievementEarned') return i18n.ts._achievements._types[`_${props.notification.achievement}`].title;
	if (props.notification.type === 'exportCompleted') return i18n.ts.showFile;
	if (props.notification.type === 'followRequestAccepted') return props.notification.message;
	if (props.notification.type === 'app') return props.notification.body;
	if (props.notification.type === 'createToken') return i18n.tsx._notification.createTokenDescription({ text: i18n.ts.manageAccessTokens });
	return null;
});

const targetPath = computed<string | null>(() => {
	if ('note' in props.notification) return notePage(props.notification.note);
	if (props.notification.type === 'chatRoomInvitationReceived') return `/chat/room/${props.notification.invitation.roomId}`;
	if (props.notification.type === 'exportCompleted') return `/my/drive/file/${props.notification.fileId}`;
	if (props.notification.type === 'createToken') return '/settings/apps';
	if (actor.value != null) return userPage(actor.value);
	return null;
});

const iconClass = computed(() => {
	switch (props.notification.type) {
		case 'achievementEarned': return 'ti ti-medal';
		case 'app': return 'ti ti-apps';
		case 'chatRoomInvitationReceived': return 'ti ti-messages';
		case 'createToken': return 'ti ti-key';
		case 'exportCompleted': return 'ti ti-archive';
		case 'login': return 'ti ti-login-2';
		case 'roleAssigned': return 'ti ti-badges';
		case 'scheduledNotePostFailed': return 'ti ti-alert-triangle';
		case 'scheduledNotePosted': return 'ti ti-send';
		default: return 'ti ti-bell';
	}
});

async function acceptFollowRequest(): Promise<void> {
	if (props.notification.type !== 'receiveFollowRequest') return;
	await os.apiWithDialog('following/requests/accept', { userId: props.notification.user.id });
	requestHandled.value = true;
}

async function rejectFollowRequest(): Promise<void> {
	if (props.notification.type !== 'receiveFollowRequest') return;
	await os.apiWithDialog('following/requests/reject', { userId: props.notification.user.id });
	requestHandled.value = true;
}
</script>

<style lang="scss" module>
.root {
	display: flex;
	gap: 13px;
	padding: 15px 16px;
	background: var(--v1-panel);
}

.iconArea {
	flex: 0 0 auto;
}

.avatar,
.icon {
	width: 46px;
	height: 46px;
	border-radius: 6px;
}

.icon {
	display: grid;
	place-items: center;
	font-size: 21px;
	color: var(--v1-accent);
	background: var(--v1-subtleBg);
}

.body {
	min-width: 0;
	flex: 1;
}

.header {
	display: flex;
	align-items: baseline;
	gap: 10px;
}

.title {
	min-width: 0;
	flex: 1;
	font-size: 13px;
	color: var(--v1-muted);
}

.actor {
	margin-right: 6px;
	font-weight: 700;
	color: var(--v1-fg);
}

.time {
	flex: 0 0 auto;
	font-size: 10px;
	color: var(--v1-muted);
}

.detail {
	display: flex;
	align-items: center;
	gap: 7px;
	margin-top: 6px;
	overflow: hidden;
	font-size: 13px;
	line-height: 1.45;
	color: var(--v1-fg);
	text-overflow: ellipsis;
	white-space: nowrap;

	&:hover {
		text-decoration: none;
		color: var(--v1-accent);
	}
}

.reaction {
	width: 20px;
	height: 20px;
}

.actions {
	display: flex;
	gap: 7px;
	margin-top: 10px;
}

.action {
	padding: 6px 12px;
	font-size: 12px;
	color: var(--v1-fg);
	background: var(--v1-subtleBg);
	border: solid 1px var(--v1-divider);
	border-radius: 4px;

	&.primary {
		color: var(--v1-accentFg);
		background: var(--v1-accent);
		border-color: var(--v1-accent);
	}
}

@container (max-width: 480px) {
	.root {
		gap: 10px;
		padding: 13px 10px;
	}

	.avatar,
	.icon {
		width: 40px;
		height: 40px;
	}
}
</style>
