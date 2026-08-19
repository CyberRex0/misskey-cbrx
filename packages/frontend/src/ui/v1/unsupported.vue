<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<section :class="$style.root" role="status">
	<i class="ti ti-device-desktop-off" :class="$style.icon"></i>
	<h1 :class="$style.title">{{ i18n.ts._v1Ui.unsupportedTitle }}</h1>
	<p :class="$style.description">{{ i18n.ts._v1Ui.unsupportedDescription }}</p>
	<div :class="$style.actions">
		<button class="_button" :class="$style.secondary" @click="mainRouter.push('/')">
			<i class="ti ti-home"></i> {{ i18n.ts.home }}
		</button>
		<button class="_button" :class="$style.primary" @click="switchToDefault">
			<i class="ti ti-devices"></i> {{ i18n.ts._v1Ui.openInDefaultUi }}
		</button>
	</div>
</section>
</template>

<script lang="ts" setup>
import { i18n } from '@/i18n.js';
import { miLocalStorage } from '@/local-storage.js';
import { definePage } from '@/page.js';
import { mainRouter } from '@/router.js';
import { unisonReload } from '@/utility/unison-reload.js';

function switchToDefault() {
	miLocalStorage.setItem('ui', 'default');
	unisonReload();
}

definePage(() => ({
	title: i18n.ts._v1Ui.unsupportedTitle,
	icon: 'ti ti-device-desktop-off',
}));
</script>

<style lang="scss" module>
.root {
	box-sizing: border-box;
	max-width: 580px;
	margin: 48px auto;
	padding: 48px 32px;
	text-align: center;
	color: var(--v1-fg);
	background: var(--v1-panel);
	border: solid 1px var(--v1-divider);
	border-radius: 4px;
	box-shadow: var(--v1-shadow);
}

.icon {
	font-size: 48px;
	color: var(--v1-muted);
}

.title {
	margin: 20px 0 8px;
	font-size: 20px;
}

.description {
	margin: 0;
	line-height: 1.7;
	color: var(--v1-muted);
}

.actions {
	display: flex;
	justify-content: center;
	gap: 12px;
	margin-top: 28px;
}

.primary,
.secondary {
	padding: 10px 16px;
	border-radius: 4px;
}

.primary {
	color: var(--v1-accentFg);
	background: var(--v1-accent);
}

.secondary {
	color: var(--v1-fg);
	background: var(--v1-subtleBg);
	border: solid 1px var(--v1-divider);
}

@media (max-width: 500px) {
	.root {
		margin: 20px 12px;
		padding: 32px 20px;
	}

	.actions {
		flex-direction: column;
	}
}
</style>
