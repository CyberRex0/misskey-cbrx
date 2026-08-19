<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<section
	:class="[$style.root, { [$style.withHeader]: widgetProps.showHeader }]"
	:style="{ height: `${widgetProps.height}px` }"
	:aria-label="i18n.ts.notifications"
>
	<header v-if="widgetProps.showHeader" :class="$style.header">
		<div :class="$style.title"><i class="ti ti-bell" aria-hidden="true"></i> {{ i18n.ts.notifications }}</div>
		<button type="button" class="_button" :class="$style.settings" :aria-label="i18n.ts.settings" @click="configureNotification">
			<i class="ti ti-settings" aria-hidden="true"></i>
		</button>
	</header>
	<div :class="$style.content">
		<MkStreamingNotificationsTimeline
			:excludeTypes="widgetProps.excludeTypes"
			:notificationComponent="V1Notification"
			:noteComponent="V1Note"
		/>
	</div>
</section>
</template>

<script lang="ts" setup>
import V1Note from '../note.vue';
import V1Notification from '../notification.vue';
import type { notificationTypes as notificationTypes_typeReferenceOnly } from 'misskey-js';
import type { FormWithDefault, GetFormResultType } from '@/utility/form.js';
import type { WidgetComponentEmits, WidgetComponentExpose, WidgetComponentProps } from '@/widgets/widget.js';
import MkStreamingNotificationsTimeline from '@/components/MkStreamingNotificationsTimeline.vue';
import { i18n } from '@/i18n.js';
import * as os from '@/os.js';
import { useWidgetPropsManager } from '@/widgets/widget.js';

defineOptions({
	name: 'V1NotificationsWidget',
});

const name = 'notifications';
const widgetPropsDef = {
	showHeader: {
		type: 'boolean',
		label: i18n.ts._widgetOptions.showHeader,
		default: true,
	},
	height: {
		type: 'number',
		label: i18n.ts.height,
		default: 300,
	},
	excludeTypes: {
		type: 'array',
		hidden: true,
		default: [] as (typeof notificationTypes_typeReferenceOnly[number])[],
	},
} satisfies FormWithDefault;

type WidgetProps = GetFormResultType<typeof widgetPropsDef>;

const props = defineProps<WidgetComponentProps<WidgetProps>>();
const emit = defineEmits<WidgetComponentEmits<WidgetProps>>();
const { widgetProps, configure, save } = useWidgetPropsManager(name, widgetPropsDef, props, emit);

async function configureNotification(): Promise<void> {
	const { dispose } = await os.popupAsyncWithDialog(import('@/components/MkNotificationSelectWindow.vue').then(x => x.default), {
		excludeTypes: widgetProps.excludeTypes,
	}, {
		done: async (result) => {
			widgetProps.excludeTypes = result.excludeTypes;
			save();
		},
		closed: () => dispose(),
	});
}

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

.settings {
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
	height: 100%;
	overflow: auto;
	overscroll-behavior: contain;
}

.withHeader .content {
	height: calc(100% - 43px);
}
</style>
