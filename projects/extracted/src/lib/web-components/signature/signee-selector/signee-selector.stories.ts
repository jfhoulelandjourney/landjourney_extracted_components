import { ChangeDetectionStrategy, Component } from '@angular/core';
import { provideRouter } from '@angular/router';
import {
    applicationConfig,
    type Meta,
    type StoryObj,
} from '@storybook/angular';
import { RequestUserRoles } from '../../../models/requestModels';
import {
    SigneeSelectorComponent,
    type SigneeSelection,
} from './signee-selector.component';

@Component({
  standalone: true,
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class StoryRouteComponent {}

const baseSignees: SigneeSelection[] = [
  {
    id: 'signee-1',
    name: 'Signee 1',
    roles: [RequestUserRoles.BORROWER],
  },
  {
    id: 'signee-2',
    name: 'Signee 2',
    roles: [RequestUserRoles.CO_BORROWER, RequestUserRoles.GUARANTOR],
  },
];

const meta: Meta<SigneeSelectorComponent> = {
  title: 'Signature/SigneeSelector',
  component: SigneeSelectorComponent,
  tags: ['autodocs', 'test'],
  decorators: [
    applicationConfig({
      providers: [provideRouter([{ path: '**', component: StoryRouteComponent }])],
    }),
  ],
};

export default meta;
type Story = StoryObj<SigneeSelectorComponent>;

export const Default: Story = {
  args: {
    allowDelete: true,
  },
  render: args => ({
    props: {
      ...args,
      options: baseSignees,
      selected: 'signee-1',
    },
  }),
};

export const SingleLockedSignee: Story = {
  args: {
    allowDelete: false,
  },
  render: args => ({
    props: {
      ...args,
      options: [
        {
          id: 'signee-owner',
          name: 'Owner signature',
          roles: [RequestUserRoles.BORROWER],
          noDelete: true,
        },
      ],
      selected: 'signee-owner',
    },
  }),
};
