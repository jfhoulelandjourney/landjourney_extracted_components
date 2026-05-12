import type { Meta, StoryObj } from '@storybook/angular';
import { GroupedAvatarComponent } from './grouped-avatar.component';
import { AvatarComponent } from '../../molecules/avatar/avatar.component';
import { CommonModule } from '@angular/common';
import {
  RequestUserRoles,
  RequestUserTypes,
} from '../../../models/requestModels';

const meta: Meta<GroupedAvatarComponent> = {
  title: 'Design System/Organisms/GroupedAvatar',
  component: GroupedAvatarComponent,
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<GroupedAvatarComponent>;

export const Default: Story = {
  render: args => ({
    props: args,
    moduleMetadata: {
      imports: [CommonModule, AvatarComponent],
    },
    template: `
      <lj-grouped-avatar [entities]="entities"></lj-grouped-avatar>
    `,
  }),
  args: {
    entities: [
      {
        firstName: 'John',
        lastName: 'Doe',
        userType: RequestUserTypes.INDIVIDUAL,
        userRole: RequestUserRoles.BORROWER,
      },
      {
        userId: 'user2',
        firstName: 'Jane',
        lastName: 'Smith',
        userType: RequestUserTypes.INDIVIDUAL,
        userRole: RequestUserRoles.COLLABORATOR,
        profile: {
          avatarUri: 'https://picsum.photos/id/55/2880/1920',
        },
      },
    ],
  },
};
