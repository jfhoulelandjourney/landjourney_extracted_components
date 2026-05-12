import type { Meta, StoryObj } from '@storybook/angular';
import { TabsComponent, TabDirective } from './tabs.component';
import { CommonModule } from '@angular/common';

const meta: Meta<TabsComponent> = {
  title: 'Design System/Molecules/Tabs',
  component: TabsComponent,
  tags: ['autodocs'],
};

export const Tabs: Story = {
  render: () => ({
    moduleMetadata: {
      imports: [CommonModule, TabDirective],
    },
    template: `
      <lj-tabs>
        <ng-template tab label="Tab 1">
          <p>Content for Tab 1</p>
        </ng-template>
        <ng-template tab label="Tab 2">
          <p>Content for Tab 2</p>
        </ng-template>
        <ng-template tab label="Tab 3">
          <p>Content for Tab 3</p>
        </ng-template>
      </lj-tabs>
    `,
  }),
};

export const WithActiveTabPreselected: StoryObj<TabsComponent> = {
  render: args => ({
    props: args,
    moduleMetadata: {
      imports: [CommonModule, TabDirective],
    },
    template: `
      <lj-tabs [activeTabIndex]="activeTabIndex">
        <ng-template tab label="Tab 1">
          <p>Content for Tab 1</p>
        </ng-template>
        <ng-template tab label="Tab 2">
          <p>Content for Tab 2</p>
        </ng-template>
        <ng-template tab label="Tab 3">
          <p>Content for Tab 3</p>
        </ng-template>
      </lj-tabs>
    `,
  }),
  args: {
    activeTabIndex: 2,
  },
};

export const WithTabsCentered: StoryObj<TabsComponent> = {
  render: args => ({
    props: args,
    moduleMetadata: {
      imports: [CommonModule, TabDirective],
    },
    template: `
      <lj-tabs [centered]="centered">
        <ng-template tab label="Tab 1">
          <p>Content for Tab 1</p>
        </ng-template>
        <ng-template tab label="Tab 2">
          <p>Content for Tab 2</p>
        </ng-template>
        <ng-template tab label="Tab 3">
          <p>Content for Tab 3</p>
        </ng-template>
      </lj-tabs>
    `,
  }),
  args: {
    centered: true,
  },
};

export default meta;
type Story = StoryObj<TabsComponent>;
