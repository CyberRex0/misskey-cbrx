<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<section :class="[$style.root, { [$style.transparent]: widgetProps.transparent }]" :aria-label="i18n.ts._widgets.activity">
	<header v-if="widgetProps.showHeader" :class="$style.header">
		<div :class="$style.title"><i class="ti ti-chart-line" aria-hidden="true"></i> {{ i18n.ts._widgets.activity }}</div>
		<button type="button" class="_button" :class="$style.switch" :aria-label="i18n.ts.switch" @click="toggleView">
			<i class="ti ti-selector" aria-hidden="true"></i>
		</button>
	</header>
	<div :class="$style.content">
		<MkLoading v-if="fetching"/>
		<template v-else>
			<XCalendar v-show="widgetProps.view === 0" :activity="activity ?? []"/>
			<XChart v-show="widgetProps.view === 1" :activity="activity ?? []"/>
		</template>
	</div>
</section>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import type { FormWithDefault, GetFormResultType } from '@/utility/form.js';
import type { WidgetComponentEmits, WidgetComponentExpose, WidgetComponentProps } from '@/widgets/widget.js';
import XCalendar from '@/widgets/WidgetActivity.calendar.vue';
import XChart from '@/widgets/WidgetActivity.chart.vue';
import { ensureSignin } from '@/i.js';
import { i18n } from '@/i18n.js';
import { misskeyApiGet } from '@/utility/misskey-api.js';
import { useWidgetPropsManager } from '@/widgets/widget.js';

defineOptions({
	name: 'V1ActivityWidget',
});

const $i = ensureSignin();
const name = 'activity';
const widgetPropsDef = {
	showHeader: {
		type: 'boolean',
		label: i18n.ts._widgetOptions.showHeader,
		default: true,
	},
	transparent: {
		type: 'boolean',
		label: i18n.ts._widgetOptions.transparent,
		default: false,
	},
	view: {
		type: 'number',
		default: 0,
		hidden: true,
	},
} satisfies FormWithDefault;

type WidgetProps = GetFormResultType<typeof widgetPropsDef>;
type Activity = {
	total: number;
	notes: number;
	replies: number;
	renotes: number;
};

const props = defineProps<WidgetComponentProps<WidgetProps>>();
const emit = defineEmits<WidgetComponentEmits<WidgetProps>>();
const { widgetProps, configure, save } = useWidgetPropsManager(name, widgetPropsDef, props, emit);
const activity = ref<Activity[] | null>(null);
const fetching = ref(true);

function toggleView(): void {
	widgetProps.view = widgetProps.view === 1 ? 0 : 1;
	save();
}

misskeyApiGet('charts/user/notes', {
	userId: $i.id,
	span: 'day',
	limit: 7 * 21,
}).then(response => {
	activity.value = response.diffs.normal.map((_, index) => ({
		total: response.diffs.normal[index] + response.diffs.reply[index] + response.diffs.renote[index],
		notes: response.diffs.normal[index],
		replies: response.diffs.reply[index],
		renotes: response.diffs.renote[index],
	}));
	fetching.value = false;
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

	&.transparent {
		background: transparent;
		border-color: transparent;
	}
}

.header {
	display: flex;
	align-items: center;
	height: 42px;
	color: var(--v1-muted, var(--MI_THEME-fg));
	background: var(--v1-panel, var(--MI_THEME-panel));
	border-bottom: solid 1px var(--v1-divider, var(--MI_THEME-divider));
}

.transparent .header {
	background: transparent;
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

.switch {
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
	min-height: 92px;
}
</style>
