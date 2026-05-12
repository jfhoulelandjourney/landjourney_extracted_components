import type { ColumnDef } from '@tanstack/angular-table';
import type { Meta, StoryObj } from '@storybook/angular';
import type { TableColumnDefWithMeta } from '../data-table.model';
import { DataTableComponent } from './data-table.component';

interface Borrower {
  id: string;
  name: string;
  state: string;
  loanType: string;
  amount: number;
  status: 'Active' | 'Pending' | 'Closed';
}

const borrowers: Borrower[] = [
  {
    id: '1',
    name: 'Pat Smith',
    state: 'IA',
    loanType: 'Operating',
    amount: 250_000,
    status: 'Active',
  },
  {
    id: '2',
    name: 'Casey Lee',
    state: 'NE',
    loanType: 'Equipment',
    amount: 180_000,
    status: 'Pending',
  },
  {
    id: '3',
    name: 'Morgan Patel',
    state: 'MN',
    loanType: 'Land',
    amount: 1_250_000,
    status: 'Active',
  },
  {
    id: '4',
    name: 'Jordan Brooks',
    state: 'IL',
    loanType: 'Operating',
    amount: 95_000,
    status: 'Closed',
  },
  {
    id: '5',
    name: 'Sage Romero',
    state: 'WI',
    loanType: 'Equipment',
    amount: 320_000,
    status: 'Active',
  },
];

const columns: TableColumnDefWithMeta<Borrower>[] = [
  { id: 'name', header: 'Borrower', accessorKey: 'name' },
  {
    id: 'state',
    header: 'State',
    accessorKey: 'state',
    meta: { fractionSize: 1 },
  },
  { id: 'loanType', header: 'Loan type', accessorKey: 'loanType' },
  {
    id: 'amount',
    header: 'Amount',
    accessorFn: (row) => `$${row.amount.toLocaleString()}`,
  },
  { id: 'status', header: 'Status', accessorKey: 'status' },
] as ColumnDef<Borrower>[];

const meta: Meta<DataTableComponent<Borrower>> = {
  title: 'Web Components/Display/Data Table',
  component: DataTableComponent,
  tags: ['autodocs'],
  argTypes: {
    title: { control: 'text' },
    searchable: { control: 'boolean' },
    pagination: { control: 'boolean' },
    pageSize: { control: 'number' },
    rowClickable: { control: 'boolean' },
    emptyMessage: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<DataTableComponent<Borrower>>;

export const Basic: Story = {
  args: {
    title: 'Active borrowers',
    data: borrowers,
    columns,
    pagination: false,
  },
};

export const Searchable: Story = {
  args: {
    title: 'Active borrowers',
    searchable: true,
    data: borrowers,
    columns,
    pagination: false,
  },
};

export const Paginated: Story = {
  args: {
    title: 'Borrowers',
    data: [
      ...borrowers,
      ...borrowers.map((b, i) => ({ ...b, id: `${b.id}b`, name: `${b.name} ${i + 1}` })),
      ...borrowers.map((b, i) => ({ ...b, id: `${b.id}c`, name: `${b.name} #${i + 100}` })),
    ],
    columns,
    pagination: true,
    pageSize: 5,
  },
};

export const Loading: Story = {
  args: {
    title: 'Borrowers',
    data: [],
    columns,
    tableLoading: true,
    pagination: false,
  },
};

export const Empty: Story = {
  args: {
    title: 'Borrowers',
    data: [],
    columns,
    emptyMessage: 'No borrowers match the current filter.',
    pagination: false,
  },
};
