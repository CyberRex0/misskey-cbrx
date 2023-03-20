import { Meta, Story } from '@storybook/vue3';
import page_button from './page.button.vue';
const meta = {
	title: 'components/page/page.button',
	component: page_button,
};
export const Default = {
	components: {
		page_button,
	},
	template: '<page_button />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;
