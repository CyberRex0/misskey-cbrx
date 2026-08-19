<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<section :class="$style.root" :style="{ height: `${widgetProps.height}px` }" :aria-label="i18n.ts._widgets.slideshow">
	<button type="button" class="_button" :class="$style.select" :aria-label="i18n.ts.selectFolder" @click="chooseFolder">
		<span v-if="widgetProps.folderId == null" :class="$style.message">{{ i18n.ts.folder }}</span>
		<span v-else-if="images.length === 0 && !fetching" :class="$style.message">{{ i18n.ts.nothing }}</span>
		<span :class="$style.slide" :style="{ backgroundImage: currentImage == null ? undefined : `url(${currentImage})` }"></span>
		<span
			:class="[$style.slide, $style.nextSlide, { [$style.visible]: showingNext, [$style.animated]: prefer.s.animation }]"
			:style="{ backgroundImage: nextImage == null ? undefined : `url(${nextImage})` }"
		></span>
	</button>
</section>
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted, ref } from 'vue';
import { useInterval } from '@@/js/use-interval.js';
import type * as Misskey from 'misskey-js';
import type { FormWithDefault, GetFormResultType } from '@/utility/form.js';
import type { WidgetComponentEmits, WidgetComponentExpose, WidgetComponentProps } from '@/widgets/widget.js';
import { i18n } from '@/i18n.js';
import { prefer } from '@/preferences.js';
import { selectDriveFolder } from '@/utility/drive.js';
import { getStaticImageUrl } from '@/utility/media-proxy.js';
import { misskeyApi } from '@/utility/misskey-api.js';
import { useWidgetPropsManager } from '@/widgets/widget.js';

defineOptions({ name: 'V1SlideshowWidget' });

const name = 'slideshow';
const widgetPropsDef = {
	height: { type: 'number', label: i18n.ts._widgetOptions.height, default: 300 },
	folderId: { type: 'string', default: null as string | null, required: false, hidden: true },
} satisfies FormWithDefault;
type WidgetProps = GetFormResultType<typeof widgetPropsDef>;

const props = defineProps<WidgetComponentProps<WidgetProps>>();
const emit = defineEmits<WidgetComponentEmits<WidgetProps>>();
const { widgetProps, configure, save } = useWidgetPropsManager(name, widgetPropsDef, props, emit);
const images = ref<Misskey.entities.DriveFile[]>([]);
const fetching = ref(false);
const currentImage = ref<string | null>(null);
const nextImage = ref<string | null>(null);
const showingNext = ref(false);
let transitionTimer: number | null = null;

function change(): void {
	if (images.value.length === 0) return;
	const image = images.value[Math.floor(Math.random() * images.value.length)];
	const imageUrl = prefer.s.disableShowingAnimatedImages ? getStaticImageUrl(image.url) : image.url;
	if (currentImage.value == null || !prefer.s.animation) {
		currentImage.value = imageUrl;
		showingNext.value = false;
		return;
	}
	if (transitionTimer != null) window.clearTimeout(transitionTimer);
	nextImage.value = imageUrl;
	showingNext.value = true;
	transitionTimer = window.setTimeout(() => {
		currentImage.value = nextImage.value;
		showingNext.value = false;
		transitionTimer = null;
	}, 1000);
}

async function fetchImages(): Promise<void> {
	fetching.value = true;
	try {
		images.value = await misskeyApi('drive/files', { folderId: widgetProps.folderId, type: 'image/*', limit: 100 });
		currentImage.value = null;
		nextImage.value = null;
		change();
	} finally {
		fetching.value = false;
	}
}

async function chooseFolder(): Promise<void> {
	const { folders, canceled } = await selectDriveFolder(null);
	const folder = folders?.at(0);
	if (canceled || folder == null) return;
	widgetProps.folderId = folder.id;
	save();
	await fetchImages();
}

useInterval(change, 10000, { immediate: false, afterMounted: true });
onMounted(() => {
	if (widgetProps.folderId != null) void fetchImages();
});
onUnmounted(() => {
	if (transitionTimer != null) window.clearTimeout(transitionTimer);
});

defineExpose<WidgetComponentExpose>({
	name,
	configure,
	get id() { return props.widget?.id ?? null; },
});
</script>

<style lang="scss" module>
.root {
	position: relative;
	overflow: hidden;
	background: var(--v1-panel, var(--MI_THEME-panel));
	border: solid 1px color-mix(in srgb, var(--v1-fg, var(--MI_THEME-fg)) 8%, transparent);
	border-radius: 6px;
}
.select { position: relative; width: 100%; height: 100%; overflow: hidden; }
.select:focus-visible { outline: solid 2px var(--MI_THEME-focus); outline-offset: -2px; }
.message { position: relative; z-index: 2; margin: 1em; color: var(--v1-muted, var(--MI_THEME-fg)); text-align: center; pointer-events: none; }
.slide { position: absolute; inset: 0; background-position: center; background-size: cover; pointer-events: none; }
.nextSlide { opacity: 0; }
.nextSlide.visible { opacity: 1; }
.nextSlide.animated { transition: opacity 1s; }
</style>
