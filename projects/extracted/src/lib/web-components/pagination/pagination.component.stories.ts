import type { Meta, StoryObj } from '@storybook/angular';
import { PaginationComponent } from './pagination.component';

const meta: Meta<PaginationComponent> = {
  title: 'Web Components/Display/Pagination',
  component: PaginationComponent,
  tags: ['autodocs'],
  argTypes: {
    currentPageIndex: { control: { type: 'number', min: 0 } },
    totalCount: { control: 'number' },
    pageSize: { control: { type: 'number', min: 1 } },
    changePage: { action: 'changePage' },
  },
};

export default meta;
type Story = StoryObj<PaginationComponent>;

export const FirstPage: Story = {
  args: { currentPageIndex: 0, totalCount: 100, pageSize: 10 },
};

export const MiddlePage: Story = {
  args: { currentPageIndex: 4, totalCount: 100, pageSize: 10 },
};

export const LastPage: Story = {
  args: { currentPageIndex: 9, totalCount: 100, pageSize: 10 },
};

export const SinglePage: Story = {
  args: { currentPageIndex: 0, totalCount: 6, pageSize: 10 },
};

export const ManyPages: Story = {
  args: { currentPageIndex: 12, totalCount: 1234, pageSize: 25 },
};
