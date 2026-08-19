<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<section :class="[$style.root, { [$style.transparent]: widgetProps.transparent }]" :aria-label="i18n.ts._widgets.calendar">
	<div :class="[$style.calendar, { [$style.holiday]: isHoliday }]">
		<p :class="$style.monthAndYear"><span>{{ i18n.tsx.yearX({ year }) }}</span><span>{{ i18n.tsx.monthX({ month }) }}</span></p>
		<p :class="$style.day">
			<template v-if="month === 1 && day === 1"><span aria-hidden="true">🎉</span>{{ i18n.tsx.dayX({ day }) }}<span aria-hidden="true">🎉</span></template>
			<template v-else>{{ i18n.tsx.dayX({ day }) }}</template>
		</p>
		<p :class="$style.weekDay">{{ weekDay }}</p>
	</div>
	<div :class="$style.info">
		<div v-for="progress in progresses" :key="progress.label" :class="$style.infoSection">
			<p :class="$style.infoText">{{ progress.label }}<b :class="$style.percentage">{{ progress.value.toFixed(1) }}%</b></p>
			<div :class="$style.meter"><div :class="[$style.meterValue, { [$style.animated]: prefer.s.animation }]" :style="{ width: `${progress.value}%` }"></div></div>
		</div>
	</div>
</section>
</template>

<script lang="ts" setup>
import { computed, onUnmounted, ref, watch } from 'vue';
import type { FormWithDefault, GetFormResultType } from '@/utility/form.js';
import type { WidgetComponentEmits, WidgetComponentExpose, WidgetComponentProps } from '@/widgets/widget.js';
import { TIME_UPDATE_INTERVAL, useLowresTime } from '@/composables/use-lowres-time.js';
import { i18n } from '@/i18n.js';
import { prefer } from '@/preferences.js';
import { useWidgetPropsManager } from '@/widgets/widget.js';

defineOptions({ name: 'V1CalendarWidget' });

const name = 'calendar';
const widgetPropsDef = {
	transparent: { type: 'boolean', label: i18n.ts._widgetOptions.transparent, default: false },
} satisfies FormWithDefault;
type WidgetProps = GetFormResultType<typeof widgetPropsDef>;

const props = defineProps<WidgetComponentProps<WidgetProps>>();
const emit = defineEmits<WidgetComponentEmits<WidgetProps>>();
const { widgetProps, configure } = useWidgetPropsManager(name, widgetPropsDef, props, emit);
const now = useLowresTime();
const year = ref(0);
const month = ref(0);
const day = ref(0);
const weekDay = ref('');
const yearProgress = ref(0);
const monthProgress = ref(0);
const dayProgress = ref(0);
const isHoliday = ref(false);
const progresses = computed(() => [
	{ label: i18n.ts.today, value: dayProgress.value },
	{ label: i18n.ts.thisMonth, value: monthProgress.value },
	{ label: i18n.ts.thisYear, value: yearProgress.value },
]);
let nextMidnight = new Date();
nextMidnight.setHours(24, 0, 0, 0);
let nextDayTimer: number | null = null;

function update(time: number): void {
	const date = new Date(time);
	const currentYear = date.getFullYear();
	const currentMonth = date.getMonth();
	const currentDay = date.getDate();
	year.value = currentYear;
	month.value = currentMonth + 1;
	day.value = currentDay;
	weekDay.value = [i18n.ts._weekday.sunday, i18n.ts._weekday.monday, i18n.ts._weekday.tuesday, i18n.ts._weekday.wednesday, i18n.ts._weekday.thursday, i18n.ts._weekday.friday, i18n.ts._weekday.saturday][date.getDay()];
	dayProgress.value = (time - new Date(currentYear, currentMonth, currentDay).getTime()) / (1000 * 60 * 60 * 24) * 100;
	monthProgress.value = (time - new Date(currentYear, currentMonth, 1).getTime()) / (new Date(currentYear, currentMonth + 1, 1).getTime() - new Date(currentYear, currentMonth, 1).getTime()) * 100;
	yearProgress.value = (time - new Date(currentYear, 0, 1).getTime()) / (new Date(currentYear + 1, 0, 1).getTime() - new Date(currentYear, 0, 1).getTime()) * 100;
	isHoliday.value = date.getDay() === 0 || date.getDay() === 6;
}

watch(now, time => {
	update(time);
	const midnightTime = nextMidnight.getTime();
	if (midnightTime - time > TIME_UPDATE_INTERVAL) return;
	if (nextDayTimer != null) window.clearTimeout(nextDayTimer);
	nextDayTimer = window.setTimeout(() => {
		update(midnightTime);
		nextDayTimer = null;
	}, Math.max(0, midnightTime - time));
}, { immediate: true });

watch(day, () => {
	nextMidnight = new Date();
	nextMidnight.setHours(24, 0, 0, 0);
});
onUnmounted(() => {
	if (nextDayTimer != null) window.clearTimeout(nextDayTimer);
});

defineExpose<WidgetComponentExpose>({
	name,
	configure,
	get id() { return props.widget?.id ?? null; },
});
</script>

<style lang="scss" module>
.root {
	display: grid;
	grid-template-columns: 3fr 2fr;
	align-items: center;
	box-sizing: border-box;
	padding: 16px;
	background: var(--v1-panel, var(--MI_THEME-panel));
	border: solid 1px color-mix(in srgb, var(--v1-fg, var(--MI_THEME-fg)) 8%, transparent);
	border-radius: 6px;

	&.transparent { background: transparent; border-color: transparent; }
}
.calendar { text-align: center; }
.monthAndYear, .weekDay { margin: 0; font-size: 0.9em; line-height: 18px; }
.monthAndYear { display: flex; justify-content: center; gap: 8px; }
.day { margin: 10px 0; font-size: 1.75em; line-height: 32px; }
.holiday .day { color: var(--MI_THEME-warn); }
.info { min-width: 0; }
.infoSection { margin-bottom: 8px; }
.infoSection:last-child { margin-bottom: 0; }
.infoText { display: flex; margin: 0 0 2px; color: var(--v1-muted, var(--MI_THEME-fg)); font-size: 0.75em; line-height: 18px; }
.percentage { margin-left: auto; }
.meter { width: 100%; overflow: hidden; background: color-mix(in srgb, var(--v1-fg, var(--MI_THEME-fg)) 12%, transparent); border-radius: var(--MI-radius); }
.meterValue { height: 4px; background: var(--v1-accent, var(--MI_THEME-accent)); }
.meterValue.animated { transition: width 0.3s cubic-bezier(0.23, 1, 0.32, 1); }
</style>
