<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<section :class="$style.root">
	<V1PostForm/>
	<header :class="$style.toolbar">
		<nav :class="$style.tabs" :aria-label="i18n.ts.timeline">
			<button
				v-for="timelineType in timelines"
				:key="timelineType"
				class="_button"
				:class="[$style.tab, { [$style.active]: src === timelineType }]"
				:aria-pressed="src === timelineType"
				@click="src = timelineType"
			>
				<i :class="basicTimelineIconClass(timelineType)" aria-hidden="true"></i>
				<span>{{ i18n.ts._timelines[timelineType] }}</span>
			</button>
		</nav>
		<div :class="$style.actions">
			<button class="_button" :class="$style.action" :aria-label="i18n.ts.reload" @click="timeline?.reloadTimeline()"><i class="ti ti-refresh" aria-hidden="true"></i></button>
			<button class="_button" :class="$style.post" @click="os.post()"><i class="ti ti-pencil" aria-hidden="true"></i><span>{{ i18n.ts.note }}</span></button>
		</div>
	</header>

	<MkStreamingNotesTimeline
		ref="timeline"
		:key="src"
		:class="$style.notes"
		:src="src"
		:noteComponent="V1Note"
		:withRenotes="filters.withRenotes"
		:withReplies="filters.withReplies"
		:withSensitive="filters.withSensitive"
		:onlyFiles="filters.onlyFiles"
		:sound="true"
	/>
</section>
</template>

<script lang="ts" setup>
import { computed, onMounted, useTemplateRef } from 'vue';
import V1Note from './note.vue';
import V1PostForm from './post-form.vue';
import type { BasicTimelineType } from '@/timelines.js';
import MkStreamingNotesTimeline from '@/components/MkStreamingNotesTimeline.vue';
import { i18n } from '@/i18n.js';
import * as os from '@/os.js';
import { definePage } from '@/page.js';
import { store } from '@/store.js';
import { availableBasicTimelines, basicTimelineIconClass, isAvailableBasicTimeline, isBasicTimeline } from '@/timelines.js';
import { deepMerge } from '@/utility/merge.js';

defineOptions({
	name: 'V1Timeline',
});

const timeline = useTemplateRef('timeline');
const timelines = computed(() => availableBasicTimelines());
const filters = computed(() => store.r.tl.value.filter);
const src = computed<BasicTimelineType>({
	get: () => isBasicTimeline(store.r.tl.value.src) ? store.r.tl.value.src : 'home',
	set: (value) => store.set('tl', deepMerge({ src: value }, store.s.tl)),
});

onMounted(() => {
	if (!isAvailableBasicTimeline(src.value)) src.value = timelines.value[0] ?? 'home';
});

definePage(() => ({
	title: i18n.ts.timeline,
	icon: basicTimelineIconClass(src.value),
}));
</script>

<style lang="scss" module>
.root {
	container-type: inline-size;
	min-height: 100%;
}

.toolbar {
	position: sticky;
	top: 0;
	z-index: 20;
	display: flex;
	align-items: stretch;
	min-height: 48px;
	background: color-mix(in srgb, var(--v1-panel) 94%, transparent);
	border-bottom: solid 1px var(--v1-divider);
	backdrop-filter: blur(8px);
}

.tabs {
	display: flex;
	min-width: 0;
	flex: 1;
}

.tab {
	position: relative;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 6px;
	min-width: 76px;
	padding: 0 14px;
	font-size: 12px;
	color: var(--v1-muted);

	&.active {
		font-weight: 700;
		color: var(--v1-accent);

		&::after {
			position: absolute;
			left: 12px;
			right: 12px;
			bottom: 0;
			height: 3px;
			content: "";
			background: var(--v1-accent);
		}
	}
}

.actions {
	display: flex;
	align-items: center;
	gap: 6px;
	padding: 7px 10px;
}

.action,
.post {
	height: 34px;
	padding: 0 11px;
	color: var(--v1-muted);
	background: var(--v1-subtleBg);
	border-radius: 3px;
}

.post {
	color: var(--v1-accentFg);
	background: var(--v1-accent);
}

.notes {
	border-radius: 0;
}

@container (max-width: 600px) {
	.tab {
		min-width: 44px;
		padding: 0 10px;

		> span {
			display: none;
		}
	}

	.actions {
		padding-right: 6px;
	}

	.post {
		> span {
			display: none;
		}
	}
}
</style>
