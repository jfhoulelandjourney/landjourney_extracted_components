import type { Meta, StoryObj } from '@storybook/angular';
import type { Field } from '../../../services/products/fields/fields.models';
import { FormulaInputComponent } from './formula-input.component';

const sampleFields = [
  {
    id: 'f1',
    name: 'income',
    label: 'Annual income',
    isSystem: true,
    fieldType: 'NUMBER',
    parameters: {},
    regulations: {},
  },
  {
    id: 'f2',
    name: 'expenses',
    label: 'Annual expenses',
    isSystem: true,
    fieldType: 'NUMBER',
    parameters: {},
    regulations: {},
  },
  {
    id: 'f3',
    name: 'creditScore',
    label: 'Credit score',
    isSystem: true,
    fieldType: 'NUMBER',
    parameters: {},
    regulations: {},
  },
] as unknown as Field[];

const meta: Meta<FormulaInputComponent> = {
  title: 'Web Components/Form/Formula Input',
  component: FormulaInputComponent,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<FormulaInputComponent>;

export const Empty: Story = {
  args: { fields: sampleFields },
};

export const SimpleFormula: Story = {
  args: { fields: sampleFields },
  render: (args) => ({
    props: args,
    template: `
      <lj-formula-input [fields]="fields" [ngModel]="'income - expenses'"></lj-formula-input>
    `,
  }),
};

export const Conditional: Story = {
  args: { fields: sampleFields },
  render: (args) => ({
    props: args,
    template: `
      <lj-formula-input [fields]="fields" [ngModel]="'IF(creditScore > 700, income * 0.05, income * 0.08)'"></lj-formula-input>
    `,
  }),
};
