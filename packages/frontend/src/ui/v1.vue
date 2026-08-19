<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="[$style.root, { [$style.mobile]: isMobile }]">
	<XMobileHeader v-if="isMobile" :title="pageMetadata?.title ?? instanceName" :menuOpen="drawerMenuShowing" @openMenu="drawerMenuShowing = true"/>
	<XHeader v-else/>

	<div :class="$style.layout">
		<aside v-if="showLeftWidgets" :class="[$style.widgets, $style.leftWidgets]">
			<XWidgets place="left" :widgetComponents="v1WidgetComponents"/>
		</aside>

		<main :class="$style.main" @contextmenu.stop="onContextmenu">
			<XTimeline v-if="isTimelineRoute"/>
			<XSearch v-else-if="isSearchRoute" :query="searchQuery"/>
			<XNotifications v-else-if="isNotificationsRoute"/>
			<XNoteDetail v-else-if="noteId" :noteId="noteId"/>
			<XUserPage v-else-if="userAcct" :acct="userAcct"/>
			<XUserFollowList v-else-if="userFollowRoute" :acct="userFollowRoute.acct" :type="userFollowRoute.type"/>
			<RouterView v-else-if="routeSupported"/>
			<XUnsupported v-else/>
		</main>

		<aside v-if="showRightWidgets" :class="$style.widgets">
			<XWidgets place="right" :widgetComponents="v1WidgetComponents"/>
		</aside>
	</div>

	<XMobileNav v-if="isMobile" v-model="drawerMenuShowing"/>
	<XCommon/>
</div>
</template>

<script lang="ts" setup>
import { computed, defineAsyncComponent, onMounted, onUnmounted, provide, ref, watch } from 'vue';
import { instanceName } from '@@/js/config.js';
import { isLink } from '@@/js/is-link.js';
import XHeader from './v1/header.vue';
import XMobileHeader from './v1/mobile-header.vue';
import XMobileNav from './v1/mobile-nav.vue';
import XNoteDetail from './v1/note-detail.vue';
import XNotifications from './v1/notifications.vue';
import XSearch from './v1/search.vue';
import XTimeline from './v1/timeline.vue';
import XUnsupported from './v1/unsupported.vue';
import XUserFollowList from './v1/user-follow-list.vue';
import XUserPage from './v1/user-page.vue';
import XCommon from './_common_/common.vue';
import { getV1NoteId, getV1SearchQuery, getV1UserAcct, getV1UserFollowRoute, isV1SupportedPath, normalizeV1Path } from './v1/routes.js';
import type { Component } from 'vue';
import type { PageMetadata } from '@/page.js';
import { DI } from '@/di.js';
import { i18n } from '@/i18n.js';
import { provideMetadataReceiver, provideReactiveMetadata } from '@/page.js';
import * as os from '@/os.js';
import { mainRouter } from '@/router.js';
import { deviceKind } from '@/utility/device-kind.js';

const XWidgets = defineAsyncComponent(() => import('@/ui/_common_/widgets.vue'));
const v1WidgetComponents: Readonly<Record<string, Component>> = {
	activity: defineAsyncComponent(() => import('./v1/widgets/activity.vue')),
	calendar: defineAsyncComponent(() => import('./v1/widgets/calendar.vue')),
	chat: defineAsyncComponent(() => import('./v1/widgets/chat.vue')),
	notifications: defineAsyncComponent(() => import('./v1/widgets/notifications.vue')),
	photos: defineAsyncComponent(() => import('./v1/widgets/photos.vue')),
	postForm: defineAsyncComponent(() => import('./v1/widgets/post-form.vue')),
	profile: defineAsyncComponent(() => import('./v1/widgets/profile.vue')),
	rss: defineAsyncComponent(() => import('./v1/widgets/rss.vue')),
	serverMetric: defineAsyncComponent(() => import('./v1/widgets/server-metric.vue')),
	slideshow: defineAsyncComponent(() => import('./v1/widgets/slideshow.vue')),
	trends: defineAsyncComponent(() => import('./v1/widgets/trends.vue')),
	userList: defineAsyncComponent(() => import('./v1/widgets/user-list.vue')),
};

defineOptions({
	name: 'V1Ui',
});

const MOBILE_THRESHOLD = 700;
const WIDGET_THRESHOLD = 1100;

const viewportWidth = ref(window.innerWidth);
const isMobile = computed(() => deviceKind === 'smartphone' || viewportWidth.value <= MOBILE_THRESHOLD);
const isRoot = computed(() => mainRouter.currentRoute.value.name === 'index');
const showLeftWidgets = computed(() => isRoot.value && viewportWidth.value >= 1280);
const showRightWidgets = computed(() => isRoot.value && viewportWidth.value >= WIDGET_THRESHOLD);
const currentFullPath = computed(() => {
	void mainRouter.currentRoute.value;
	return mainRouter.getCurrentFullPath();
});
const currentPath = computed(() => normalizeV1Path(currentFullPath.value));
const isTimelineRoute = computed(() => currentPath.value === '/' || currentPath.value === '/timeline');
const isSearchRoute = computed(() => currentPath.value === '/search');
const isNotificationsRoute = computed(() => currentPath.value === '/my/notifications');
const searchQuery = computed(() => getV1SearchQuery(currentFullPath.value));
const noteId = computed(() => getV1NoteId(currentPath.value));
const userAcct = computed(() => getV1UserAcct(currentPath.value));
const userFollowRoute = computed(() => getV1UserFollowRoute(currentPath.value));
const routeSupported = computed(() => {
	return isV1SupportedPath(currentPath.value);
});

const pageMetadata = ref<null | PageMetadata>(null);
const drawerMenuShowing = ref(false);

provide(DI.router, mainRouter);
provideMetadataReceiver((metadataGetter) => {
	const info = metadataGetter();
	pageMetadata.value = info;
	window.document.title = info.title === instanceName ? info.title : `${info.title} | ${instanceName}`;
});
provideReactiveMetadata(pageMetadata);

function onResize() {
	viewportWidth.value = window.innerWidth;
}

function onContextmenu(ev: PointerEvent) {
	const target = ev.target as HTMLElement;
	if (isLink(target)) return;
	if (['INPUT', 'TEXTAREA', 'IMG', 'VIDEO', 'CANVAS'].includes(target.tagName) || target.attributes.getNamedItem('contenteditable') != null) return;
	if (window.getSelection()?.toString() !== '') return;

	const path = mainRouter.getCurrentFullPath();
	os.contextMenu([{
		type: 'label',
		text: path,
	}, {
		icon: 'ti ti-window-maximize',
		text: i18n.ts.openInWindow,
		action: () => os.pageWindow(path),
	}], ev);
}

watch(isMobile, (mobile) => {
	if (!mobile) drawerMenuShowing.value = false;
});

onMounted(() => window.addEventListener('resize', onResize, { passive: true }));
onUnmounted(() => window.removeEventListener('resize', onResize));
</script>

<style lang="scss" module>
.root {
	--v1-bg: light-dark(#f6f6f6, #1f2329);
	--v1-panel: light-dark(#ffffff, #282c37);
	--v1-header: light-dark(#f7f7f7, #313543);
	--v1-headerFg: light-dark(#9eaba8, #b8c5ca);
	--v1-headerFgHover: light-dark(#66706e, #ffffff);
	--v1-mobileHeader: #1b2023;
	--v1-mobileHeaderFg: rgba(255, 255, 255, 0.9);
	--v1-fg: light-dark(#555f5d, #d5dcda);
	--v1-muted: light-dark(#777777, #a8b0ae);
	--v1-divider: light-dark(#e8e8e8, #1c2023);
	--v1-subtleBg: light-dark(#f2f2f2, #313543);
	--v1-inputBg: light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.08));
	--v1-accent: var(--MI_THEME-accent);
	--v1-accentFg: var(--MI_THEME-fgOnAccent);
	--v1-shadowColor: #000000;
	--v1-shadow: 0 1px 4px color-mix(in srgb, var(--v1-shadowColor) 18%, transparent);
	--MI_THEME-bg: var(--v1-bg);
	--MI_THEME-panel: var(--v1-panel);
	--MI_THEME-fg: var(--v1-fg);
	--MI_THEME-fgOnPanel: var(--v1-fg);
	--MI_THEME-navBg: var(--v1-header);
	--MI_THEME-navFg: var(--v1-headerFg);
	--MI_THEME-divider: var(--v1-divider);
	--MI_THEME-inputBorder: var(--v1-divider);
	--MI_THEME-buttonBg: var(--v1-subtleBg);

	min-height: 100dvh;
	color: var(--v1-fg);
	background: var(--v1-bg);
}

.layout {
	display: flex;
	justify-content: center;
	width: 100%;
	max-width: 1300px;
	margin: 0 auto;
}

.main {
	box-sizing: border-box;
	container-type: inline-size;
	width: min(100%, 750px);
	min-width: 0;
	min-height: calc(100dvh - 48px);
	background: var(--v1-bg);
	border-right: solid 1px var(--v1-divider);
	border-left: solid 1px var(--v1-divider);
	--MI-margin: 12px;
}

.widgets {
	box-sizing: border-box;
	width: 300px;
	padding: 16px 0 16px 16px;
}

.leftWidgets {
	padding-right: 16px;
	padding-left: 0;
}

.mobile {
	padding-top: 48px;

	.main {
		width: 100%;
		min-height: calc(100dvh - 48px);
		border: 0;
	}
}
</style>
