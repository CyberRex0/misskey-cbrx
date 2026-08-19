<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<section :class="$style.root">
	<div v-if="user.isSuspended" :class="[$style.caution, $style.danger]"><i class="ti ti-alert-triangle"></i> {{ i18n.ts.userSuspended }}</div>
	<div v-if="user.host != null" :class="$style.caution">
		<i class="ti ti-alert-triangle"></i> {{ i18n.ts.remoteUserCaution }}
		<a v-if="remoteUrl" :href="remoteUrl" target="_blank" rel="noopener noreferrer">{{ i18n.ts.showOnRemote }}</a>
	</div>

	<div :class="$style.banner" :style="bannerStyle"></div>
	<div :class="$style.identity">
		<MkAvatar :class="$style.avatar" :user="user" preview/>
		<div :class="$style.title">
			<h1><MkUserName :user="user"/></h1>
			<div :class="$style.acct"><MkAcct :user="user"/></div>
			<div v-if="user.location" :class="$style.location"><i class="ti ti-map-pin"></i> {{ user.location }}</div>
		</div>
		<div :class="$style.actions">
			<MkFollowButton v-if="$i?.id !== user.id" v-model:user="user" full/>
			<button class="_button" :class="$style.menu" :aria-label="i18n.ts.menu" @click="openMenu"><i class="ti ti-dots"></i></button>
		</div>
	</div>

	<div v-if="user.isFollowed" :class="$style.followed"><i class="ti ti-arrow-back-up"></i> {{ i18n.ts.followsYou }}</div>

	<div v-if="user.description" :class="$style.description" class="_selectable">
		<Mfm :text="user.description" :isNote="false" :author="user"/>
	</div>

	<dl v-if="user.birthday || user.fields.length > 0" :class="$style.fields">
		<div v-if="user.birthday" :class="$style.field">
			<dt><i class="ti ti-cake"></i> {{ i18n.ts.birthday }}</dt>
			<dd>{{ user.birthday.replaceAll('-', '/') }}</dd>
		</div>
		<div v-for="field in user.fields" :key="field.name" :class="$style.field">
			<dt>{{ field.name }}</dt>
			<dd><Mfm :text="field.value" :isNote="false" :author="user"/></dd>
		</div>
	</dl>

	<nav :class="$style.stats" :aria-label="i18n.ts.profile">
		<div><strong>{{ number(user.notesCount) }}</strong><span>{{ i18n.ts.notes }}</span></div>
		<MkA :to="`${userPage(user)}/following`"><strong>{{ number(user.followingCount) }}</strong><span>{{ i18n.ts.following }}</span></MkA>
		<MkA :to="`${userPage(user)}/followers`"><strong>{{ number(user.followersCount) }}</strong><span>{{ i18n.ts.followers }}</span></MkA>
	</nav>
</section>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import type * as Misskey from 'misskey-js';
import MkFollowButton from '@/components/MkFollowButton.vue';
import { userPage } from '@/filters/user.js';
import number from '@/filters/number.js';
import { i18n } from '@/i18n.js';
import { $i } from '@/i.js';
import * as os from '@/os.js';
import { getUserMenu } from '@/utility/get-user-menu.js';

const user = defineModel<Misskey.entities.UserDetailed>('user', { required: true });
const bannerStyle = computed(() => user.value.bannerUrl == null ? undefined : { backgroundImage: `url(${user.value.bannerUrl})` });
const remoteUrl = computed(() => user.value.url ?? user.value.uri ?? undefined);

function openMenu(ev: PointerEvent): void {
	const { menu, cleanup } = getUserMenu(user.value);
	os.popupMenu(menu, ev.currentTarget ?? ev.target).finally(cleanup);
}
</script>

<style lang="scss" module>
.root {
	background: var(--v1-panel);
	border-bottom: solid 1px var(--v1-divider);
	box-shadow: var(--v1-shadow);
}

.caution {
	padding: 10px 16px;
	font-size: 13px;
	color: var(--MI_THEME-infoWarnFg);
	background: var(--MI_THEME-infoWarnBg);

	a {
		margin-left: 8px;
		font-weight: 700;
	}
}

.danger {
	color: var(--MI_THEME-error);
}

.banner {
	height: 220px;
	background-color: var(--v1-subtleBg);
	background-position: center;
	background-size: cover;
}

.identity {
	position: relative;
	display: flex;
	align-items: flex-end;
	min-height: 70px;
	padding: 0 16px 12px 150px;
}

.avatar {
	position: absolute;
	left: 20px;
	bottom: 16px;
	width: 112px;
	height: 112px;
	border: solid 3px var(--v1-panel);
	border-radius: 6px;
	box-shadow: var(--v1-shadow);
}

.title {
	min-width: 0;
	flex: 1;

	h1 {
		margin: 0;
		overflow: hidden;
		font-size: 23px;
		line-height: 1.3;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
}

.acct,
.location {
	display: inline-block;
	margin: 3px 12px 0 0;
	font-size: 12px;
	color: var(--v1-muted);
}

.actions {
	display: flex;
	align-items: center;
	gap: 7px;
	margin-left: 12px;
}

.menu {
	width: 34px;
	height: 32px;
	color: var(--v1-muted);
	background: var(--v1-subtleBg);
	border: solid 1px var(--v1-divider);
	border-radius: 4px;
}

.followed {
	margin: 0 16px 12px;
	padding: 7px 10px;
	font-size: 12px;
	text-align: center;
	color: var(--MI_THEME-infoFg);
	background: var(--MI_THEME-infoBg);
	border-radius: 3px;
}

.description {
	padding: 14px 18px;
	font-size: 14px;
	line-height: 1.6;
	border-top: solid 1px var(--v1-divider);
}

.fields {
	margin: 0;
	padding: 8px 18px;
	border-top: solid 1px var(--v1-divider);
}

.field {
	display: grid;
	grid-template-columns: minmax(90px, 0.35fr) 1fr;
	gap: 12px;
	padding: 6px 0;
	font-size: 13px;

	dt {
		font-weight: 700;
		color: var(--v1-muted);
	}

	dd {
		min-width: 0;
		margin: 0;
		overflow-wrap: anywhere;
	}
}

.stats {
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	border-top: solid 1px var(--v1-divider);

	> a,
	> div {
		display: flex;
		align-items: baseline;
		justify-content: center;
		gap: 7px;
		padding: 13px 8px;
		color: var(--v1-fg);
		border-right: solid 1px var(--v1-divider);

		&:last-child {
			border-right: 0;
		}

		&:hover {
			text-decoration: none;
			background: var(--v1-subtleBg);
		}
	}

	strong {
		font-size: 18px;
	}

	span {
		font-size: 11px;
		color: var(--v1-muted);
	}
}

@container (max-width: 480px) {
	.banner {
		height: 160px;
	}

	.identity {
		min-height: 64px;
		padding: 0 10px 10px 104px;
	}

	.avatar {
		left: 12px;
		bottom: 12px;
		width: 78px;
		height: 78px;
	}

	.title h1 {
		font-size: 18px;
	}

	.actions {
		margin-left: 6px;
	}

	.stats span {
		display: none;
	}
}
</style>
