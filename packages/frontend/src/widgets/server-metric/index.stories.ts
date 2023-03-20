import { Meta, Story } from '@storybook/vue3';
import index from './index.vue';
const meta = {
	title: 'widgets/server-metric/index',
	component: index,
};
export const Default = {
	components: {
		index,
	},
	template: '<index />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;
