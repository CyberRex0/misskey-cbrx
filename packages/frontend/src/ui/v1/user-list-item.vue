<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<article :class="$style.root">
	<MkA :class="$style.avatarLink" :to="userPage(user)">
		<MkAvatar :class="$style.avatar" :user="user" indicator/>
	</MkA>
	<div :class="$style.body">
		<div :class="$style.heading">
			<div :class="$style.identity">
				<MkA :class="$style.name" :to="userPage(user)"><MkUserName :user="user"/></MkA>
				<div :class="$style.acct"><MkAcct :user="user"/></div>
			</div>
			<MkFollowButton v-if="$i?.id !== user.id" v-model:user="user" full/>
		</div>
		<div v-if="user.isFollowed" :class="$style.followed">{{ i18n.ts.followsYou }}</div>
		<div v-if="user.description" :class="$style.description" class="_selectable">
			<Mfm :text="user.description" :isNote="false" :author="user"/>
		</div>
		<div v-else :class="$style.description">{{ i18n.ts.noAccountDescription }}</div>
	</div>
</article>
</template>

<script lang="ts" setup>
import type * as Misskey from 'misskey-js';
import MkFollowButton from '@/components/MkFollowButton.vue';
import { userPage } from '@/filters/user.js';
import { i18n } from '@/i18n.js';
import { $i } from '@/i.js';

const user = defineModel<Misskey.entities.UserDetailed>('user', { required: true });
</script>

<style lang="scss" module>
.root {
	display: flex;
	gap: 14px;
	padding: 16px;
	background: var(--v1-panel);
	border-bottom: solid 1px var(--v1-divider);
}

.avatarLink {
	flex: 0 0 auto;
}

.avatar {
	width: 58px;
	height: 58px;
	border-radius: 6px;
}

.body,
.identity {
	min-width: 0;
}

.body {
	flex: 1;
}

.heading {
	display: flex;
	align-items: flex-start;
	gap: 12px;
}

.identity {
	flex: 1;
}

.name {
	display: block;
	overflow: hidden;
	font-size: 15px;
	font-weight: 700;
	color: var(--v1-fg);
	text-overflow: ellipsis;
	white-space: nowrap;

	&:hover {
		text-decoration: none;
		color: var(--v1-accent);
	}
}

.acct,
.followed,
.description {
	font-size: 12px;
	color: var(--v1-muted);
}

.acct {
	margin-top: 2px;
}

.followed {
	display: inline-block;
	margin-top: 5px;
	padding: 2px 6px;
	color: var(--MI_THEME-infoFg);
	background: var(--MI_THEME-infoBg);
	border-radius: 3px;
}

.description {
	display: -webkit-box;
	margin-top: 9px;
	overflow: hidden;
	line-height: 1.5;
	-webkit-box-orient: vertical;
	-webkit-line-clamp: 2;
}

@container (max-width: 480px) {
	.root {
		gap: 10px;
		padding: 13px 10px;
	}

	.avatar {
		width: 48px;
		height: 48px;
	}
}
</style>
