<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<section :class="$style.root" :aria-label="i18n.ts._widgets.trends">
	<header v-if="widgetProps.showHeader" :class="$style.header">
		<div :class="$style.title"><i class="ti ti-hash" aria-hidden="true"></i> {{ i18n.ts._widgets.trends }}</div>
		<button type="button" class="_button" :class="$style.reload" :aria-label="i18n.ts.reload" :disabled="refreshing" @click="fetchTrends">
			<i class="ti ti-refresh" aria-hidden="true"></i>
		</button>
	</header>
	<div :class="$style.content">
		<MkLoading v-if="fetching"/>
		<TransitionGroup v-else tag="div" :moveClass="prefer.s.animation ? $style.move : undefined">
			<div v-for="stat in stats" :key="stat.tag" :class="$style.item">
				<div :class="$style.tag">
					<MkA :class="$style.tagLink" :to="`/tags/${encodeURIComponent(stat.tag)}`" :title="stat.tag">#{{ stat.tag }}</MkA>
					<p>{{ i18n.tsx.nUsersMentioned({ n: stat.usersCount }) }}</p>
				</div>
				<MkMiniChart :class="$style.chart" :src="stat.chart"/>
			</div>
		</TransitionGroup>
	</div>
</section>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { useInterval } from '@@/js/use-interval.js';
import type * as Misskey from 'misskey-js';
import type { FormWithDefault, GetFormResultType } from '@/utility/form.js';
import type { WidgetComponentEmits, WidgetComponentExpose, WidgetComponentProps } from '@/widgets/widget.js';
import MkMiniChart from '@/components/MkMiniChart.vue';
import { i18n } from '@/i18n.js';
import { prefer } from '@/preferences.js';
import { misskeyApiGet } from '@/utility/misskey-api.js';
import { useWidgetPropsManager } from '@/widgets/widget.js';

defineOptions({
	name: 'V1TrendsWidget',
});

const name = 'trends';
const widgetPropsDef = {
	showHeader: {
		type: 'boolean',
		label: i18n.ts._widgetOptions.showHeader,
		default: true,
	},
} satisfies FormWithDefault;

type WidgetProps = GetFormResultType<typeof widgetPropsDef>;

const props = defineProps<WidgetComponentProps<WidgetProps>>();
const emit = defineEmits<WidgetComponentEmits<WidgetProps>>();
const { widgetProps, configure } = useWidgetPropsManager(name, widgetPropsDef, props, emit);
const stats = ref<Misskey.entities.HashtagsTrendResponse>([]);
const fetching = ref(true);
const refreshing = ref(false);

async function fetchTrends(): Promise<void> {
	if (refreshing.value) return;
	refreshing.value = true;
	try {
		stats.value = await misskeyApiGet('hashtags/trend');
	} finally {
		fetching.value = false;
		refreshing.value = false;
	}
}

useInterval(fetchTrends, 1000 * 60, {
	immediate: true,
	afterMounted: true,
});

defineExpose<WidgetComponentExpose>({
	name,
	configure,
	get id() {
		return props.widget?.id ?? null;
	},
});
</script>

<style lang="scss" module>
.root {
	container-type: inline-size;
	overflow: hidden;
	background: var(--v1-panel, var(--MI_THEME-panel));
	border: solid 1px color-mix(in srgb, var(--v1-fg, var(--MI_THEME-fg)) 8%, transparent);
	border-radius: 6px;
}

.header {
	display: flex;
	align-items: center;
	height: 42px;
	color: var(--v1-muted, var(--MI_THEME-fg));
	background: var(--v1-panel, var(--MI_THEME-panel));
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

	> i {
		margin-right: 6px;
	}
}

.reload {
	display: grid;
	flex: 0 0 42px;
	align-self: stretch;
	place-items: center;
	color: var(--v1-muted, var(--MI_THEME-fg));

	&:hover,
	&:focus-visible {
		color: var(--v1-accent, var(--MI_THEME-accent));
	}

	&:focus-visible {
		outline: solid 2px var(--MI_THEME-focus);
		outline-offset: -2px;
	}
}

.content {
	height: 314px;
	overflow: hidden;
}

.item {
	display: flex;
	align-items: center;
	height: 62px;
	padding: 0 16px;
	border-bottom: solid 1px var(--v1-divider, var(--MI_THEME-divider));
}

.tag {
	min-width: 0;
	flex: 1;
	font-size: 0.9em;
	color: var(--v1-fg, var(--MI_THEME-fg));

	p {
		margin: 0;
		font-size: 75%;
		line-height: 16px;
		color: var(--v1-muted, var(--MI_THEME-fg));
	}
}

.tagLink {
	display: block;
	overflow: hidden;
	line-height: 18px;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.chart {
	flex: 0 0 auto;
	height: 30px;
}

.move {
	transition: transform 1s ease;
}
</style>
