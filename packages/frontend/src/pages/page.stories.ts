import { Meta, Story } from '@storybook/vue3';
import page from './page.vue';
const meta = {
	title: 'pages/page',
	component: page,
};
export const Default = {
	components: {
		page,
	},
	template: '<page />',
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;
