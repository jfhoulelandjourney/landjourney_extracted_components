import {
    FormControl,
    FormGroup,
    FormsModule,
    ReactiveFormsModule,
} from '@angular/forms';
import { provideAnimations } from '@angular/platform-browser/animations';
import {
    applicationConfig,
    moduleMetadata,
    type Meta,
    type StoryObj,
} from '@storybook/angular';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { LjDateFieldComponent } from './date-field.component';

// Helper functions

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const typeAndAssertValue = async (input: HTMLElement, value: string) => {
  await userEvent.type(input, value, { delay: 100 });
  await expect(input).toHaveValue(value);
};

const getInputs = (canvas: HTMLElement) => {
  const _canvas = within(canvas);
  const standaloneInput = _canvas.getByLabelText('Standalone: Select Date');
  const templateInput = _canvas.getByLabelText('Template: Select Date');
  const reactiveInput = _canvas.getByLabelText('Reactive: Select Date');
  return { standaloneInput, templateInput, reactiveInput };
};

// Define the component metadata
const meta: Meta<LjDateFieldComponent> = {
  title: 'Design System/Molecules/Inputs/Date Field',
  component: LjDateFieldComponent,
  tags: ['autodocs'],
  decorators: [
    applicationConfig({
      providers: [provideAnimations()],
    }),
    moduleMetadata({
      imports: [FormsModule, ReactiveFormsModule, LjDateFieldComponent],
    }),
  ],
  argTypes: {
    value: { control: 'date', description: 'The selected date value' },
    label: { control: 'text' },
    placeholder: { control: 'text' },
    required: { control: 'boolean' },
    disabled: { control: 'boolean' },
    readonly: { control: 'boolean' },
    style: { control: 'select', options: ['normal', 'gray'] },
    stripped: { control: 'boolean' },
    showError: { control: 'boolean' },
    dateSelected: { action: 'dateSelected' },
    inputBlur: { action: 'inputBlur' },
  },
  parameters: {
    layout: 'centered',
  },
  args: {
    name: 'storyDateField',
    label: 'Select Date',
    placeholder: 'MM/DD/YYYY',
    value: null,
    required: false,
    disabled: false,
    readonly: false,
    style: 'normal',
    stripped: false,
    showError: true,
    // Mock function for actions
    dateSelected: fn(),
    inputBlur: fn(),
  },
};

export default meta;
type Story = StoryObj<LjDateFieldComponent>;

export const Default: Story = {
  args: {
    label: 'Select Date',
  },
  render: args => ({
    props: {
      ...args,
      standaloneLabel: `Standalone: ${args.label}`,
      standaloneValue: args.value,
      updateStandaloneValue: (newValue: Date | null) => {
        // @ts-expect-error Created in runtime
        args.standaloneValue = newValue; // Update the standalone value dynamically
        args.dateSelected(newValue);
      },
      templateLabel: `Template: ${args.label}`,
      templateValue: args.value,
      reactiveLabel: `Reactive: ${args.label}`,
      reactiveForm: new FormGroup({
        storyDateField: new FormControl(args.value),
      }),
    },
    template: `
      <div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 20px; padding: 2rem; border: 1px dashed #ccc; box-sizing: border-box;">
        <!-- Standalone Example -->
        <div>
          <h3>Standalone</h3>
          <lj-date-field
            #input
            [name]="name"
            [label]="standaloneLabel"
            [placeholder]="placeholder"
            [value]="standaloneValue"
            [required]="required"
            [disabled]="disabled"
            [readonly]="readonly"
            [minDate]="minDate"
            [maxDate]="maxDate"
            [style]="style"
            [stripped]="stripped"
            [showError]="showError"
            (dateSelected)="updateStandaloneValue($event)" 
            (inputBlur)="inputBlur($event)"
          ></lj-date-field>
          <pre>value: <br />{{ input.value() | json }}</pre>
          <pre>touched: {{ input.touched() }}</pre>
          <pre>dirty: {{ input.dirty() }}</pre>
          <pre>errors: {{ input.errors | json }}</pre>
          <pre>valid: {{ !input.invalid() }}</pre>
        </div>
        
        <!-- Template-based Form Example -->
        <form #storyForm="ngForm">
          <h3>Template-based (ngModel)</h3>
          <lj-date-field
            [name]="name"
            [label]="templateLabel"
            [placeholder]="placeholder"
            [(ngModel)]="templateValue"
            #dateFieldModel="ngModel"
            [required]="required"
            [disabled]="disabled"
            [readonly]="readonly"
            [minDate]="minDate"
            [maxDate]="maxDate"
            [style]="style"
            [stripped]="stripped"
            [showError]="showError"
            (dateSelected)="dateSelected($event)"
            (inputBlur)="inputBlur($event)"
          ></lj-date-field>
          <pre>value: <br /> {{ storyForm.value.storyDateField | json }}</pre>
          <pre>touched: {{ dateFieldModel.touched }}</pre>
          <pre>dirty: {{ dateFieldModel.dirty }}</pre>
          <pre>errors: {{ storyForm.form.controls?.storyDateField?.errors | json }}</pre>
          <pre>valid: {{ storyForm.form.valid }}</pre>
        </form>

        <!-- Reactive Form Example -->
        <form [formGroup]="reactiveForm">
          <h3>Reactive Form (FormControl)</h3>
          <lj-date-field
            [name]="name"
            formControlName="storyDateField"
            [label]="reactiveLabel"
            [placeholder]="placeholder"
            [required]="required"
            [disabled]="disabled"
            [readonly]="readonly"
            [minDate]="minDate"
            [maxDate]="maxDate"
            [style]="style"
            [stripped]="stripped"
            [showError]="showError"
            (dateSelected)="dateSelected($event)"
            (inputBlur)="inputBlur($event)"
            ></lj-date-field>
          <pre>value: <br />{{ reactiveForm.value.storyDateField | json }}</pre>
          <pre>touched: {{ reactiveForm.get('storyDateField')?.touched }}</pre>
          <pre>dirty: {{ reactiveForm.get('storyDateField')?.dirty }}</pre>
          <pre>errors: {{ reactiveForm.get('storyDateField')?.errors | json }}</pre>
          <pre>valid: {{ reactiveForm.valid }}</pre>
        </form>
      </div>
    `,
  }),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // Test the Standalone example
    const standaloneInput = canvas.getByLabelText('Standalone: Select Date');
    await typeAndAssertValue(standaloneInput, '12/25/2024');
    await expect(args.dateSelected).toHaveBeenCalled();

    // Test the Template-based form
    const templateInput = canvas.getByLabelText('Template: Select Date');
    await typeAndAssertValue(templateInput, '12/31/2024');

    // Test the Reactive Form
    const reactiveInput = canvas.getByLabelText('Reactive: Select Date');
    await typeAndAssertValue(reactiveInput, '01/01/2025');
  },
};

export const Required: Story = {
  ...Default,
  args: {
    required: true,
    minDate: new Date(2025, 5, 5).getTime(),
    maxDate: new Date(2025, 5, 10).getTime(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const { standaloneInput, templateInput, reactiveInput } =
      getInputs(canvasElement);

    for (const input of [standaloneInput, templateInput, reactiveInput]) {
      // Assert the input is required
      await expect(input).toBeRequired();

      // Simulate focusing and clearing the input
      await userEvent.click(input);
      await userEvent.clear(input);
      await userEvent.tab();

      // Assert the error message is displayed
      await expect(
        canvas.getByText('This field is required')
      ).toBeInTheDocument();

      await typeAndAssertValue(input, '06/08/2025');

      await expect(
        canvas.queryByText('This field is required')
      ).not.toBeInTheDocument();

      await wait(500);

      // Assert the input is required
      await expect(input).toBeRequired();
    }
  },
};

export const WithInitialValue: Story = {
  args: {
    ...Default.args,
    label: 'Pre-filled Date',
    value: new Date(2024, 10, 15), // Nov 15, 2024
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const dateInput = canvas.getByLabelText('Pre-filled Date');

    await expect(dateInput).toHaveValue('11/15/2024');

    await wait(2000);

    // Find the datepicker toggle button
    const toggleButton = canvas.getByRole('button', { name: /open calendar/i });
    await userEvent.click(toggleButton);

    // Wait for the calendar animation to end
    await wait(500); // Wait 500ms
    await wait(2000);

    // Wait for the calendar to appear
    await waitFor(() => {
      expect(within(document.body).getByText('NOV')).toBeInTheDocument();
    });

    // Find a specific date button in the calendar
    const dateToSelect = await within(document.body).findByRole('button', {
      name: /November 20, 2024/i,
    });
    await userEvent.click(dateToSelect);

    // Wait for the calendar animation to end
    await new Promise(resolve => setTimeout(resolve, 500)); // Wait 500ms

    // Assert the input value updated
    await expect(dateInput).toHaveValue('11/20/2024');

    // Assert that the dateSelected output was called with the new date
    await expect(args.dateSelected).toHaveBeenCalled();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const lastCallArgs = (args.dateSelected as any).mock.lastCall[0] as number;
    // Convert the timestamp back to a Date object
    const date = new Date(lastCallArgs);
    await expect(date.getFullYear()).toBe(2024);
    await expect(date.getMonth()).toBe(10); // November = 10
    await expect(date.getDate()).toBe(20);
  },
};

// Add play functions to other stories (Disabled, ReadOnly, etc.)
// to test their specific interactions or lack thereof.

export const Disabled: Story = {
  args: {
    ...Default.args,
    label: 'Disabled Date',
    value: new Date(),
    disabled: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const dateInput = canvas.getByLabelText('Disabled Date');
    // Assert the input is disabled
    await expect(dateInput).toBeDisabled();
  },
};

export const ReadOnly: Story = {
  args: {
    ...Default.args,
    label: 'Read-Only Date',
    value: new Date(),
    readonly: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const dateInput = canvas.getByLabelText('Read-Only Date');
    // Assert the input has the readonly attribute
    await expect(dateInput).toHaveAttribute('readonly');
    // Try to type - it shouldn't change the value
    const initialValue = (dateInput as HTMLInputElement).value;
    await userEvent.type(dateInput, 'abc');
    await expect(dateInput).toHaveValue(initialValue);
  },
};

export const MinDate: Story = {
  args: {
    ...Default.args,
    label: 'Min Date',
    minDate: new Date(2025, 5, 5).getTime(),
  },
};

export const MaxDate: Story = {
  args: {
    label: 'Max Date',
    maxDate: new Date(2025, 5, 10).getTime(), // June 10, 2025
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const dateInput = canvas.getByLabelText('Max Date');

    // Try typing a date after the maxDate
    await userEvent.type(dateInput, '06/15/2025', { delay: 100 });
    await userEvent.tab();

    // Assert the input value is cleared or invalid
    await expect(dateInput).toHaveValue('');

    // Try typing a valid date within the range
    await userEvent.type(dateInput, '06/10/2025', { delay: 100 });
    await expect(dateInput).toHaveValue('06/10/2025');
  },
};

export const MinAndMaxDate: Story = {
  args: {
    label: 'Min/Max Date',
    minDate: new Date(2025, 5, 5).getTime(), // June 5, 2025
    maxDate: new Date(2025, 5, 10).getTime(), // June 10, 2025
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const dateInput = canvas.getByLabelText('Min/Max Date');

    // Try typing a date outside the range
    await userEvent.type(dateInput, '06/01/2025', { delay: 100 });
    await userEvent.tab();
    await expect(dateInput).toHaveValue('');

    // Try typing a valid date within the range
    await userEvent.type(dateInput, '06/07/2025', { delay: 100 });
    await expect(dateInput).toHaveValue('06/07/2025');
  },
};

export const GrayStyle: Story = {
  args: {
    label: 'Gray Style Date',
    style: 'gray',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const dateInput = canvas.getByLabelText('Gray Style Date');

    // Assert the input has the gray style class
    await expect(dateInput).toHaveClass('gray');
  },
};

export const Stripped: Story = {
  args: {
    label: 'Stripped Date',
    stripped: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const dateInput = canvas.getByPlaceholderText('MM/DD/YYYY');

    await expect(dateInput).toBeInTheDocument();
    await expect(canvas.queryByText('Stripped Date')).not.toBeInTheDocument();
  },
};

export const WithoutLabel: Story = {
  args: {
    label: undefined,
    placeholder: 'Enter Date (MM/DD/YYYY)',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const dateInput = canvas.getByPlaceholderText('Enter Date (MM/DD/YYYY)');

    // Assert the input has the correct placeholder
    await expect(dateInput).toHaveAttribute(
      'placeholder',
      'Enter Date (MM/DD/YYYY)'
    );
  },
};
