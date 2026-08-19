<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<article v-if="!hardMuted && !hideByPlugin" ref="rootEl" :class="$style.root" tabindex="0" @contextmenu.stop="onContextmenu">
	<div v-if="isPureRenote" :class="$style.renote">
		<i class="ti ti-repeat"></i>
		<MkA :to="userPage(note.user)" :class="$style.renoteUser"><MkUserName :user="note.user"/></MkA>
		<span>{{ i18n.ts.renoted }}</span>
		<MkTime :time="note.createdAt"/>
	</div>

	<MkNoteSub v-if="appearNote.reply" :note="appearNote.reply" :class="$style.reply"/>

	<div v-if="muted" :class="$style.muted">
		<button class="_button" :class="$style.reveal" @click="muted = false">{{ i18n.ts.showMore }}</button>
	</div>
	<div v-else :class="$style.body">
		<MkAvatar :class="$style.avatar" :user="appearNote.user" link preview/>
		<div :class="$style.main">
			<header :class="$style.header">
				<div :class="$style.identity">
					<MkA :to="userPage(appearNote.user)" :class="$style.name"><MkUserName :user="appearNote.user"/></MkA>
					<MkAcct :user="appearNote.user" :class="$style.acct"/>
				</div>
				<MkA :to="`/notes/${appearNote.id}`" :class="$style.time"><MkTime :time="appearNote.createdAt"/></MkA>
			</header>

			<div v-if="appearNote.cw != null" :class="$style.cw">
				<Mfm v-if="appearNote.cw !== ''" :text="appearNote.cw" :author="appearNote.user" :emojiUrls="appearNote.emojis"/>
				<button class="_button" :class="$style.cwButton" @click="showContent = !showContent">
					{{ showContent ? i18n.ts.showLess : i18n.ts.showMore }}
				</button>
			</div>

			<div v-show="appearNote.cw == null || showContent">
				<div v-if="appearNote.text" :class="$style.text" class="_selectable">
					<Mfm :parsedNodes="parsed" :text="appearNote.text" :author="appearNote.user" :emojiUrls="appearNote.emojis" :enableEmojiMenu="true" :enableEmojiMenuReaction="true"/>
				</div>
				<MkMediaList v-if="appearNote.files && appearNote.files.length > 0" ref="galleryEl" :class="$style.media" :mediaList="appearNote.files"/>
				<MkPoll
					v-if="appearNote.poll"
					:class="$style.poll"
					:noteId="appearNote.id"
					:multiple="appearNote.poll.multiple"
					:expiresAt="appearNote.poll.expiresAt"
					:choices="$appearNote.pollChoices"
					:author="appearNote.user"
					:emojiUrls="appearNote.emojis"
				/>
				<div v-if="isQuote && appearNote.renote" :class="$style.quote">
					<MkNoteSimple :note="appearNote.renote"/>
				</div>
			</div>

			<MkReactionsViewer
				v-if="appearNote.reactionAcceptance !== 'likeOnly'"
				:class="$style.reactions"
				:reactions="$appearNote.reactions"
				:reactionEmojis="$appearNote.reactionEmojis"
				:myReaction="$appearNote.myReaction"
				:noteId="appearNote.id"
				:maxNumber="16"
			/>

			<footer :class="$style.footer">
				<button class="_button" :class="$style.action" :aria-label="i18n.ts.reply" @click="reply()">
					<i class="ti ti-arrow-back-up"></i><span v-if="appearNote.repliesCount > 0">{{ number(appearNote.repliesCount) }}</span>
				</button>
				<button v-if="canRenote" ref="renoteButton" class="_button" :class="$style.action" :aria-label="i18n.ts.renote" @click="renote()">
					<i class="ti ti-repeat"></i><span v-if="appearNote.renoteCount > 0">{{ number(appearNote.renoteCount) }}</span>
				</button>
				<button ref="reactButton" class="_button" :class="$style.action" :aria-label="i18n.ts.reaction" @click="toggleReact()">
					<i :class="$appearNote.myReaction == null ? 'ti ti-plus' : 'ti ti-minus'"></i><span v-if="$appearNote.reactionCount > 0">{{ number($appearNote.reactionCount) }}</span>
				</button>
				<button ref="menuButton" class="_button" :class="$style.action" :aria-label="i18n.ts.menu" @click="showMenu()">
					<i class="ti ti-dots"></i>
				</button>
			</footer>
		</div>
	</div>
</article>
<div v-else></div>
</template>

<script lang="ts" setup>
import { computed, inject, provide, ref, useTemplateRef } from 'vue';
import type { Ref } from 'vue';
import type * as Misskey from 'misskey-js';
import { createV1NotePresentation } from './note-model.js';
import MkMediaList from '@/components/MkMediaList.vue';
import MkNoteSimple from '@/components/MkNoteSimple.vue';
import MkNoteSub from '@/components/MkNoteSub.vue';
import MkPoll from '@/components/MkPoll.vue';
import MkReactionsViewer from '@/components/MkReactionsViewer.vue';
import { useNote } from '@/composables/use-note.js';
import { DI } from '@/di.js';
import { userPage } from '@/filters/user.js';
import number from '@/filters/number.js';
import { i18n } from '@/i18n.js';

const props = withDefaults(defineProps<{
	note: Misskey.entities.Note;
	withHardMute?: boolean;
}>(), {
	withHardMute: false,
});

provide(DI.mock, false);

const presentation = computed(() => createV1NotePresentation(props.note));
const isPureRenote = computed(() => presentation.value.isPureRenote);
const isQuote = computed(() => presentation.value.isQuote);
const inTimeline = inject<boolean>('inTimeline', false);
const tlWithSensitive = inject<Ref<boolean>>('tl_withSensitive', ref(true));
const inChannel = inject(DI.inChannel, null);
const currentClip = inject<Ref<Misskey.entities.Clip> | null>('currentClip', null);
const currentAntenna = inject<Ref<Misskey.entities.Antenna | null> | null>('currentAntenna', null);
const rootEl = useTemplateRef('rootEl');
const menuButton = useTemplateRef('menuButton');
const renoteButton = useTemplateRef('renoteButton');
const reactButton = useTemplateRef('reactButton');
const galleryEl = useTemplateRef('galleryEl');

const {
	note,
	appearNote,
	$appearNote,
	hideByPlugin,
	showContent,
	muted,
	hardMuted,
	parsed,
	canRenote,
	renote,
	reply,
	reactViaMfmEmoji,
	toggleReact,
	onContextmenu,
	showMenu,
} = useNote(props, {
	rootEl,
	menuButton,
	renoteButton,
	renoteTime: ref(null),
	reactButton,
	clipButton: ref(null),
}, {
	inTimeline,
	tl_withSensitive: tlWithSensitive,
	inChannel,
	currentClip,
	currentAntenna,
});

provide(DI.mfmEmojiReactCallback, reactViaMfmEmoji);
</script>

<style lang="scss" module>
.root {
	position: relative;
	background: var(--v1-panel);
	border-bottom: solid 1px var(--v1-divider);
	outline: none;

	&:focus-visible {
		box-shadow: inset 0 0 0 2px var(--MI_THEME-focus);
	}
}

.renote {
	display: flex;
	align-items: center;
	gap: 6px;
	padding: 8px 18px 0 76px;
	font-size: 12px;
	color: var(--MI_THEME-renote);

	> time,
	> :last-child {
		margin-left: auto;
	}
}

.renoteUser,
.name {
	font-weight: 700;
	color: inherit;
}

.reply {
	padding: 12px 18px 0 76px;
	opacity: 0.65;
}

.body {
	display: flex;
	gap: 12px;
	padding: 16px 18px 10px;
}

.avatar {
	flex: 0 0 auto;
	width: 46px;
	height: 46px;
	border-radius: 4px;
}

.main {
	min-width: 0;
	flex: 1;
}

.header {
	display: flex;
	align-items: baseline;
	gap: 8px;
	margin-bottom: 5px;
}

.identity {
	min-width: 0;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.acct,
.time {
	margin-left: 7px;
	font-size: 12px;
	color: var(--v1-muted);
}

.time {
	margin-left: auto;
	white-space: nowrap;
}

.text {
	font-size: 14px;
	line-height: 1.55;
	overflow-wrap: anywhere;
}

.cw {
	margin-bottom: 6px;
	font-weight: 700;
}

.cwButton,
.reveal {
	margin-top: 5px;
	padding: 3px 10px;
	color: var(--v1-accentFg);
	background: var(--v1-accent);
	border-radius: 3px;
}

.media,
.poll,
.quote,
.reactions {
	margin-top: 8px;
}

.quote {
	overflow: clip;
	border: solid 1px var(--v1-divider);
	border-radius: 3px;
}

.footer {
	display: flex;
	align-items: center;
	margin-top: 8px;
	margin-left: -8px;
}

.action {
	display: inline-flex;
	align-items: center;
	gap: 5px;
	min-width: 54px;
	padding: 5px 8px;
	font-size: 13px;
	color: var(--v1-muted);

	&:hover {
		color: var(--v1-accent);
	}
}

.muted {
	padding: 20px;
	text-align: center;
}

@container (max-width: 480px) {
	.renote {
		padding-left: 62px;
	}

	.reply {
		padding-left: 62px;
	}

	.body {
		gap: 10px;
		padding: 12px 10px 8px;
	}

	.avatar {
		width: 42px;
		height: 42px;
	}
}
</style>
