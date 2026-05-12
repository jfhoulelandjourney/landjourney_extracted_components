import type { Meta, StoryObj } from '@storybook/angular';
import { ColorPickerComponent } from './color-picker.component';

const meta: Meta<ColorPickerComponent> = {
  title: 'Web Components/Form/Color Picker',
  component: ColorPickerComponent,
  tags: ['autodocs'],
  argTypes: {
    label: { control: 'text' },
    defaultColor: { control: 'color' },
    onColorChange: { action: 'onColorChange' },
  },
};

export default meta;
type Story = StoryObj<ColorPickerComponent>;

export const BrandColor: Story = {
  args: { label: 'Brand color', defaultColor: '#06C1B8' },
};

export const AccentColor: Story = {
  args: { label: 'Accent color', defaultColor: '#F59E0B' },
};

export const ErrorColor: Story = {
  args: { label: 'Error color', defaultColor: '#DC2626' },
};

export const Empty: Story = {
  args: { label: 'Pick a color', defaultColor: '' },
};
