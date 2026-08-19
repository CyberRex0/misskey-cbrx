<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<section :class="$style.root" :aria-label="i18n.ts._widgets.rss">
	<header v-if="widgetProps.showHeader" :class="$style.header">
		<div :class="$style.title"><i class="ti ti-rss" aria-hidden="true"></i> {{ i18n.ts._widgets.rss }}</div>
		<button type="button" class="_button" :class="$style.settings" :aria-label="i18n.ts.settings" @click="configure">
			<i class="ti ti-settings" aria-hidden="true"></i>
		</button>
	</header>
	<MkLoading v-if="fetching"/>
	<MkResult v-else-if="items.length === 0 && widgetProps.showHeader" type="empty"/>
	<div v-else :class="$style.feed">
		<a v-for="item in items" :key="item.link" :class="$style.item" :href="item.link" rel="nofollow noopener" target="_blank" :title="item.title">{{ item.title }}</a>
	</div>
</section>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import { url as base } from '@@/js/config.js';
import { useInterval } from '@@/js/use-interval.js';
import { tryParseUrl } from '@@/js/url.js';
import type * as Misskey from 'misskey-js';
import type { FormWithDefault, GetFormResultType } from '@/utility/form.js';
import type { WidgetComponentEmits, WidgetComponentExpose, WidgetComponentProps } from '@/widgets/widget.js';
import { i18n } from '@/i18n.js';
import { useWidgetPropsManager } from '@/widgets/widget.js';

defineOptions({ name: 'V1RssWidget' });

const name = 'rss';
const widgetPropsDef = {
	url: { type: 'string', label: i18n.ts._widgetOptions._rss.url, default: 'http://feeds.afpbb.com/rss/afpbb/afpbbnews', manualSave: true },
	refreshIntervalSec: { type: 'number', label: i18n.ts._widgetOptions._rss.refreshIntervalSec, default: 60 },
	maxEntries: { type: 'number', label: i18n.ts._widgetOptions._rss.maxEntries, default: 15 },
	showHeader: { type: 'boolean', label: i18n.ts._widgetOptions.showHeader, default: true },
} satisfies FormWithDefault;
type WidgetProps = GetFormResultType<typeof widgetPropsDef>;

const props = defineProps<WidgetComponentProps<WidgetProps>>();
const emit = defineEmits<WidgetComponentEmits<WidgetProps>>();
const { widgetProps, configure } = useWidgetPropsManager(name, widgetPropsDef, props, emit);
const rawItems = ref<Misskey.entities.FetchRssResponse['items']>([]);
const items = computed(() => rawItems.value.slice(0, widgetProps.maxEntries));
const fetching = ref(true);
const fetchEndpoint = computed(() => {
	const endpoint = new URL('/api/fetch-rss', base);
	endpoint.searchParams.set('url', widgetProps.url);
	return endpoint.toString();
});
let nextFetchAt = 0;

async function fetchFeed(): Promise<void> {
	try {
		const response = await window.fetch(fetchEndpoint.value);
		if (!response.ok) return;
		const feed: Misskey.entities.FetchRssResponse = await response.json();
		rawItems.value = feed.items.filter(item => {
			if (!item.link) return false;
			const itemUrl = tryParseUrl(item.link, base);
			return itemUrl != null && ['http:', 'https:'].includes(itemUrl.protocol);
		});
	} catch {
		rawItems.value = [];
	} finally {
		fetching.value = false;
	}
}

watch([fetchEndpoint, () => widgetProps.refreshIntervalSec], () => {
	void fetchFeed();
	nextFetchAt = Date.now() + Math.max(10000, widgetProps.refreshIntervalSec * 1000);
}, { immediate: true });

useInterval(() => {
	if (Date.now() < nextFetchAt) return;
	nextFetchAt = Date.now() + Math.max(10000, widgetProps.refreshIntervalSec * 1000);
	void fetchFeed();
}, 1000, {
	immediate: false,
	afterMounted: true,
});

defineExpose<WidgetComponentExpose>({
	name,
	configure,
	get id() { return props.widget?.id ?? null; },
});
</script>

<style lang="scss" module>
.root { overflow: hidden; background: var(--v1-panel, var(--MI_THEME-panel)); border: solid 1px color-mix(in srgb, var(--v1-fg, var(--MI_THEME-fg)) 8%, transparent); border-radius: 6px; }
.header { display: flex; align-items: center; height: 42px; border-bottom: solid 1px var(--v1-divider, var(--MI_THEME-divider)); }
.title { min-width: 0; flex: 1; padding: 0 16px; font-size: 0.9em; font-weight: bold; }
.title > i { margin-right: 6px; }
.settings { display: grid; flex: 0 0 42px; align-self: stretch; place-items: center; color: var(--v1-muted, var(--MI_THEME-fg)); }
.settings:hover, .settings:focus-visible { color: var(--v1-accent, var(--MI_THEME-accent)); }
.settings:focus-visible { outline: solid 2px var(--MI_THEME-focus); outline-offset: -2px; }
.feed { font-size: 0.9em; }
.item { display: block; padding: 8px 16px; overflow: hidden; color: var(--v1-fg, var(--MI_THEME-fg)); text-overflow: ellipsis; white-space: nowrap; }
.item:nth-child(even) { background: color-mix(in srgb, var(--v1-fg, var(--MI_THEME-fg)) 5%, transparent); }
.item:hover, .item:focus-visible { color: var(--v1-accent, var(--MI_THEME-accent)); background: var(--v1-subtleBg, var(--MI_THEME-buttonBg)); }
</style>
