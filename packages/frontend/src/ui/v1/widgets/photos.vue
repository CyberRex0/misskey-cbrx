<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<section :class="[$style.root, { [$style.transparent]: widgetProps.transparent }]" :aria-label="i18n.ts._widgets.photos">
	<header v-if="widgetProps.showHeader" :class="$style.header">
		<div :class="$style.title"><i class="ti ti-camera" aria-hidden="true"></i> {{ i18n.ts._widgets.photos }}</div>
	</header>
	<MkLoading v-if="fetching"/>
	<div v-else :class="$style.stream">
		<img v-for="image in images" :key="image.id" :class="$style.image" :src="thumbnail(image)" :alt="image.name">
	</div>
</section>
</template>

<script lang="ts" setup>
import { onUnmounted, ref } from 'vue';
import type * as Misskey from 'misskey-js';
import type { FormWithDefault, GetFormResultType } from '@/utility/form.js';
import type { WidgetComponentEmits, WidgetComponentExpose, WidgetComponentProps } from '@/widgets/widget.js';
import { i18n } from '@/i18n.js';
import { prefer } from '@/preferences.js';
import { useStream } from '@/stream.js';
import { getStaticImageUrl } from '@/utility/media-proxy.js';
import { misskeyApi } from '@/utility/misskey-api.js';
import { useWidgetPropsManager } from '@/widgets/widget.js';

defineOptions({ name: 'V1PhotosWidget' });

const name = 'photos';
const widgetPropsDef = {
	showHeader: { type: 'boolean', label: i18n.ts._widgetOptions.showHeader, default: true },
	transparent: { type: 'boolean', label: i18n.ts._widgetOptions.transparent, default: false },
} satisfies FormWithDefault;
type WidgetProps = GetFormResultType<typeof widgetPropsDef>;

const props = defineProps<WidgetComponentProps<WidgetProps>>();
const emit = defineEmits<WidgetComponentEmits<WidgetProps>>();
const { widgetProps, configure } = useWidgetPropsManager(name, widgetPropsDef, props, emit);
const connection = useStream().useChannel('main');
const images = ref<Misskey.entities.DriveFile[]>([]);
const fetching = ref(true);

function thumbnail(image: Misskey.entities.DriveFile): string {
	return prefer.s.disableShowingAnimatedImages ? getStaticImageUrl(image.url) : image.thumbnailUrl ?? image.url;
}

function onDriveFileCreated(file: Misskey.entities.DriveFile): void {
	if (!/^image\/.+$/.test(file.type)) return;
	images.value.unshift(file);
	if (images.value.length > 9) images.value.pop();
}

async function fetchPhotos(): Promise<void> {
	try {
		images.value = await misskeyApi('drive/stream', { type: 'image/*', limit: 9 });
	} catch {
		images.value = [];
	} finally {
		fetching.value = false;
	}
}

void fetchPhotos();
connection.on('driveFileCreated', onDriveFileCreated);
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

	&.transparent { background: transparent; border-color: transparent; }
}
.header { display: flex; align-items: center; height: 42px; border-bottom: solid 1px var(--v1-divider, var(--MI_THEME-divider)); }
.title { padding: 0 16px; font-size: 0.9em; font-weight: bold; }
.title > i { margin-right: 6px; }
.stream { display: grid; grid-template-columns: repeat(3, 1fr); padding: 8px; }
.image {
	box-sizing: border-box;
	width: 100%;
	min-width: 0;
	height: 80px;
	object-fit: cover;
	border: solid 2px transparent;
	border-radius: 4px;
}
.transparent .stream { padding: 0; }
.transparent .image { border-width: 4px; border-radius: 8px; }
</style>
