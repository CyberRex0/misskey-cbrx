<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<section :class="$style.root" :aria-label="i18n.ts.note">
	<MkPostForm v-bind="props" fixed :class="$style.form" @posted="emit('posted')"/>
</section>
</template>

<script lang="ts" setup>
import type { PostFormProps } from '@/types/post-form.js';
import MkPostForm from '@/components/MkPostForm.vue';
import { i18n } from '@/i18n.js';

const props = defineProps<PostFormProps>();
const emit = defineEmits<{
	(ev: 'posted'): void;
}>();
</script>

<style lang="scss" module>
.root {
	padding: 14px 16px 10px;
	background: var(--v1-subtleBg);
	border-bottom: solid 1px var(--v1-divider);
}

.form {
	overflow: clip;
	background: var(--v1-panel);
	border: solid 1px var(--v1-divider);
	border-radius: 4px;
	box-shadow: 0 1px 2px color-mix(in srgb, var(--v1-shadowColor) 8%, transparent);

	textarea,
	input {
		border-radius: 3px;
	}

	textarea {
		min-height: 72px;
		font-size: 14px;
	}

	button:focus-visible {
		outline: solid 2px var(--MI_THEME-focus);
		outline-offset: -2px;
	}
}

@container (max-width: 480px) {
	.root {
		padding: 8px;
	}
}
</style>
