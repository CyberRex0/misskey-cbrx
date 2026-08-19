<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.root">
	<div
		:class="$style.banner"
		:style="{ backgroundImage: $i.bannerUrl ? `url(${ $i.bannerUrl })` : undefined }"
	></div>
	<MkA :class="$style.avatarLink" :to="userPage($i)">
		<MkAvatar :class="$style.avatar" :user="$i"/>
	</MkA>
	<div :class="$style.identity">
		<MkA :class="$style.name" :to="userPage($i)">
			<MkUserName :user="$i"/>
		</MkA>
		<div :class="$style.username"><MkAcct :user="$i" detail/></div>
	</div>
</div>
</template>

<script lang="ts" setup>
import type { FormWithDefault, GetFormResultType } from '@/utility/form.js';
import type { WidgetComponentEmits, WidgetComponentExpose, WidgetComponentProps } from '@/widgets/widget.js';
import { userPage } from '@/filters/user.js';
import { ensureSignin } from '@/i.js';
import { useWidgetPropsManager } from '@/widgets/widget.js';

defineOptions({
	name: 'V1ProfileWidget',
});

const $i = ensureSignin();
const name = 'profile';

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
	position: relative;
	overflow: hidden;
	color: var(--v1-fg, var(--MI_THEME-fg));
	background: var(--v1-panel, var(--MI_THEME-panel));
	border: solid 1px color-mix(in srgb, var(--v1-fg, var(--MI_THEME-fg)) 8%, transparent);
	border-radius: 6px;
}

.banner {
	height: 100px;
	background-color: var(--v1-subtleBg, var(--MI_THEME-bg));
	background-position: center;
	background-size: cover;
}

.avatarLink {
	position: absolute;
	top: 76px;
	left: 16px;
	display: block;
	border-radius: 8px;
}

.avatar {
	display: block;
	box-sizing: border-box;
	width: 58px;
	height: 58px;
	border: solid 3px var(--v1-panel, var(--MI_THEME-panel));
	border-radius: 8px;
}

.identity {
	min-height: 42px;
	padding: 10px 12px 8px 84px;
	line-height: 16px;
}

.name {
	display: block;
	overflow: hidden;
	font-weight: bold;
	color: var(--v1-fg, var(--MI_THEME-fg));
	text-overflow: ellipsis;
	white-space: nowrap;
}

.username {
	overflow: hidden;
	margin-top: 4px;
	font-size: 0.9em;
	color: var(--v1-muted, var(--MI_THEME-fg));
	text-overflow: ellipsis;
	white-space: nowrap;
}
</style>
