<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<section :class="[$style.root, { [$style.transparent]: widgetProps.transparent }]" :aria-label="i18n.ts._widgets.serverMetric">
	<header v-if="widgetProps.showHeader" :class="$style.header">
		<div :class="$style.title"><i class="ti ti-server" aria-hidden="true"></i> {{ i18n.ts._widgets.serverMetric }}</div>
		<button type="button" class="_button" :class="$style.switch" :aria-label="i18n.ts.switch" @click="toggleView">
			<i class="ti ti-selector" aria-hidden="true"></i>
		</button>
	</header>
	<div :class="$style.content" data-testid="mkw-serverMetric">
		<MkLoading v-if="fetching"/>
		<MkResult v-else-if="failed" type="error"/>
		<template v-else-if="meta != null">
			<XCpuMemory v-if="widgetProps.view === 0" :connection="connection" :meta="meta"/>
			<XNet v-else-if="widgetProps.view === 1" :connection="connection" :meta="meta"/>
			<XCpu v-else-if="widgetProps.view === 2" :connection="connection" :meta="meta"/>
			<XMemory v-else-if="widgetProps.view === 3" :connection="connection" :meta="meta"/>
			<XDisk v-else :meta="meta"/>
		</template>
	</div>
</section>
</template>

<script lang="ts" setup>
import { onUnmounted, ref } from 'vue';
import type * as Misskey from 'misskey-js';
import type { FormWithDefault, GetFormResultType } from '@/utility/form.js';
import type { WidgetComponentEmits, WidgetComponentExpose, WidgetComponentProps } from '@/widgets/widget.js';
import XCpuMemory from '@/widgets/server-metric/cpu-mem.vue';
import XCpu from '@/widgets/server-metric/cpu.vue';
import XDisk from '@/widgets/server-metric/disk.vue';
import XMemory from '@/widgets/server-metric/mem.vue';
import XNet from '@/widgets/server-metric/net.vue';
import { i18n } from '@/i18n.js';
import { useStream } from '@/stream.js';
import { misskeyApiGet } from '@/utility/misskey-api.js';
import { useWidgetPropsManager } from '@/widgets/widget.js';

defineOptions({ name: 'V1ServerMetricWidget' });

const name = 'serverMetric';
const widgetPropsDef = {
	showHeader: { type: 'boolean', label: i18n.ts._widgetOptions.showHeader, default: true },
	transparent: { type: 'boolean', label: i18n.ts._widgetOptions.transparent, default: false },
	view: { type: 'number', default: 0, hidden: true },
} satisfies FormWithDefault;
type WidgetProps = GetFormResultType<typeof widgetPropsDef>;

const props = defineProps<WidgetComponentProps<WidgetProps>>();
const emit = defineEmits<WidgetComponentEmits<WidgetProps>>();
const { widgetProps, configure, save } = useWidgetPropsManager(name, widgetPropsDef, props, emit);
const meta = ref<Misskey.entities.ServerInfoResponse | null>(null);
const fetching = ref(true);
const failed = ref(false);
const connection = useStream().useChannel('serverStats');

function toggleView(): void {
	widgetProps.view = widgetProps.view >= 4 ? 0 : widgetProps.view + 1;
	save();
}

async function fetchServerInfo(): Promise<void> {
	try {
		meta.value = await misskeyApiGet('server-info', {});
	} catch {
		failed.value = true;
	} finally {
		fetching.value = false;
	}
}

void fetchServerInfo();
onUnmounted(() => connection.dispose());

defineExpose<WidgetComponentExpose>({
	name,
	configure,
	get id() { return props.widget?.id ?? null; },
});
</script>

<style lang="scss" module>
.root {
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
	border-bottom: solid 1px var(--v1-divider, var(--MI_THEME-divider));
}

.title {
	min-width: 0;
	flex: 1;
	padding: 0 16px;
	font-size: 0.9em;
	font-weight: bold;

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
	min-height: 100px;
}
</style>
