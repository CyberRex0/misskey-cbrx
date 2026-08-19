<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<section :class="$style.root" :aria-label="i18n.ts._widgets.chat">
	<header v-if="widgetProps.showHeader" :class="$style.header">
		<div :class="$style.title"><i class="ti ti-messages" aria-hidden="true"></i> {{ i18n.ts._widgets.chat }}</div>
		<MkA :class="$style.start" to="/chat" :aria-label="i18n.ts.startChat">
			<i class="ti ti-plus" aria-hidden="true"></i>
		</MkA>
	</header>
	<div :class="$style.content">
		<MkChatHistories/>
	</div>
</section>
</template>

<script lang="ts" setup>
import type { FormWithDefault, GetFormResultType } from '@/utility/form.js';
import type { WidgetComponentEmits, WidgetComponentExpose, WidgetComponentProps } from '@/widgets/widget.js';
import MkChatHistories from '@/components/MkChatHistories.vue';
import { i18n } from '@/i18n.js';
import { useWidgetPropsManager } from '@/widgets/widget.js';

defineOptions({
	name: 'V1ChatWidget',
});

const name = 'chat';
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

.start {
	display: grid;
	flex: 0 0 42px;
	align-self: stretch;
	place-items: center;
	color: var(--v1-muted, var(--MI_THEME-fg));

	&:hover,
	&:focus-visible {
		color: var(--v1-accent, var(--MI_THEME-accent));
		text-decoration: none;
	}

	&:focus-visible {
		outline: solid 2px var(--MI_THEME-focus);
		outline-offset: -2px;
	}
}

.content {
	max-height: 250px;
	overflow: auto;
	overscroll-behavior: contain;
	background: var(--v1-bg, var(--MI_THEME-bg));
}
</style>
