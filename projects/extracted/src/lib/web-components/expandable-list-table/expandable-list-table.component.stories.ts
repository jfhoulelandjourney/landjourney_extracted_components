import type { Meta, StoryObj } from '@storybook/angular';
import { ExpandableListTableComponent } from './expandable-list-table.component';

const meta: Meta<ExpandableListTableComponent> = {
  title: 'Web Components/Display/Expandable List Table',
  component: ExpandableListTableComponent,
  tags: ['autodocs'],
  argTypes: {
    title: { control: 'text' },
    searchable: { control: 'boolean' },
    search: { control: 'text' },
    currentPage: { control: 'number' },
    totalCount: { control: 'number' },
    pageSize: { control: 'number' },
    searchChange: { action: 'searchChange' },
    changePage: { action: 'changePage' },
  },
};

export default meta;
type Story = StoryObj<ExpandableListTableComponent>;

export const WithRows: Story = {
  args: {
    title: 'Active loans',
    searchable: true,
    currentPage: 0,
    totalCount: 23,
    pageSize: 10,
  },
  render: (args) => ({
    props: args,
    template: `
      <lj-expandable-list-table
        [title]="title"
        [searchable]="searchable"
        [currentPage]="currentPage"
        [totalCount]="totalCount"
        [pageSize]="pageSize">
        <div style="padding: 12px; border-bottom: 1px solid #eee;">Loan #1042 — Pat Smith — $250,000</div>
        <div style="padding: 12px; border-bottom: 1px solid #eee;">Loan #1043 — Casey Lee — $180,000</div>
        <div style="padding: 12px; border-bottom: 1px solid #eee;">Loan #1044 — Morgan Patel — $310,000</div>
        <div style="padding: 12px; border-bottom: 1px solid #eee;">Loan #1045 — Jordan Brooks — $95,000</div>
      </lj-expandable-list-table>
    `,
  }),
};

export const Empty: Story = {
  args: {
    title: 'Pending applications',
    searchable: true,
    currentPage: 0,
    totalCount: 0,
    pageSize: 10,
  },
  render: (args) => ({
    props: args,
    template: `
      <lj-expandable-list-table
        [title]="title"
        [searchable]="searchable"
        [currentPage]="currentPage"
        [totalCount]="totalCount"
        [pageSize]="pageSize">
        <div style="padding: 24px; text-align: center; color: #94a3b8;">No applications.</div>
      </lj-expandable-list-table>
    `,
  }),
};
