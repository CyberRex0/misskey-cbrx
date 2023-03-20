import { Meta, Story } from '@storybook/vue3';
import index from './index.vue';
const meta = {
	title: 'pages/admin/index',
	component: index,
};
export const Default = {
	components: {
		index,
	},
	template: '<index />',
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;
