<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<section :class="$style.root" :aria-label="i18n.ts._widgets.postForm">
	<header :class="$style.header">
		<i class="ti ti-pencil" aria-hidden="true"></i>
		{{ i18n.ts._widgets.postForm }}
	</header>
	<MkPostForm data-testid="v1-post-form-widget" :class="$style.form" fixed :autofocus="false"/>
</section>
</template>

<script lang="ts" setup>
import type { FormWithDefault, GetFormResultType } from '@/utility/form.js';
import type { WidgetComponentEmits, WidgetComponentExpose, WidgetComponentProps } from '@/widgets/widget.js';
import MkPostForm from '@/components/MkPostForm.vue';
import { i18n } from '@/i18n.js';
import { useWidgetPropsManager } from '@/widgets/widget.js';

defineOptions({
	name: 'V1PostFormWidget',
});

const name = 'postForm';
const widgetPropsDef = {
} satisfies FormWithDefault;

type WidgetProps = GetFormResultType<typeof widgetPropsDef>;

const props = defineProps<WidgetComponentProps<WidgetProps>>();
const emit = defineEmits<WidgetComponentEmits<WidgetProps>>();
const { configure } = useWidgetPropsManager(name, widgetPropsDef, props, emit);

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
	overflow: hidden;
	background: var(--v1-panel, var(--MI_THEME-panel));
	border: solid 1px color-mix(in srgb, var(--v1-fg, var(--MI_THEME-fg)) 8%, transparent);
	border-radius: 6px;
}

.header {
	box-sizing: border-box;
	height: 42px;
	padding: 0 16px;
	font-size: 0.9em;
	font-weight: bold;
	line-height: 42px;
	color: var(--v1-muted, var(--MI_THEME-fg));
	background: var(--v1-panel, var(--MI_THEME-panel));
	border-bottom: solid 1px var(--v1-divider, var(--MI_THEME-divider));

	> i {
		margin-right: 6px;
	}
}

.form {
	background: var(--v1-panel, var(--MI_THEME-panel));
	border-radius: 0;
	box-shadow: none;

	textarea {
		min-height: 72px;
		font-size: 14px;
	}

	button:focus-visible {
		outline: solid 2px var(--MI_THEME-focus);
		outline-offset: -2px;
	}
}
</style>
