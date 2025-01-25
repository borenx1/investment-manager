'use client';

import { format } from 'date-fns';
import {
  ColumnDef,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { EllipsisVertical, Pencil, Trash2 } from 'lucide-react';

import { removeCapitalTransaction } from '@/lib/actions';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { DataTable, DataTablePagination } from '@/components/ui/data-table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export type Transaction = {
  capitalTransaction: { id: number };
  transaction: {
    id: number;
    title: string;
    description: string | null;
    date: Date;
  };
  assetEntry: { amount: string };
  feeIncomeEntry: { amount: string } | null;
  portfolioAccount: { name: string };
  asset: { ticker: string; precision: number };
};

export const columns: ColumnDef<Transaction>[] = [
  {
    accessorKey: 'transaction.date',
    header: 'Date',
    cell: ({ row }) => {
      const date = row.original.transaction.date;
      return (
        <div className="font-mono">
          {format(
            new Date(
              date.getUTCFullYear(),
              date.getUTCMonth(),
              date.getUTCDate(),
            ),
            'yyyy/MM/dd',
          )}
        </div>
      );
    },
  },
  {
    accessorKey: 'portfolioAccount.name',
    header: () => <div className="min-w-[80px]">Account</div>,
  },
  {
    accessorKey: 'asset.ticker',
    header: 'Asset',
  },
  {
    accessorKey: 'assetEntry.amount',
    header: () => <div className="min-w-[80px] text-right">Amount</div>,
    cell: ({ row }) => {
      const amount = parseFloat(row.original.assetEntry.amount);
      const formatted = new Intl.NumberFormat(undefined, {
        style: 'decimal',
        minimumFractionDigits: row.original.asset.precision,
        maximumFractionDigits: row.original.asset.precision,
      }).format(amount);
      return <div className="text-right font-mono">{formatted}</div>;
    },
  },
  {
    accessorKey: 'feeIncomeEntry.amount',
    header: () => <div className="min-w-[80px] text-right">Fee</div>,
    cell: ({ row }) => {
      if (!row.original.feeIncomeEntry) {
        return '';
      }
      const amount = parseFloat(row.original.feeIncomeEntry.amount);
      const formatted = new Intl.NumberFormat(undefined, {
        style: 'decimal',
        minimumFractionDigits: row.original.asset.precision,
        maximumFractionDigits: row.original.asset.precision,
      }).format(amount);
      return <div className="text-right font-mono">{formatted}</div>;
    },
  },
  {
    accessorKey: 'transaction.title',
    header: () => <div className="min-w-[80px]">Title</div>,
  },
  {
    accessorKey: 'transaction.description',
    header: () => <div className="min-w-[100px]">Notes</div>,
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const transaction = row.original;
      const date = transaction.transaction.date;
      const amount = parseFloat(transaction.assetEntry.amount);
      const formattedAmount = new Intl.NumberFormat(undefined, {
        style: 'decimal',
        minimumFractionDigits: row.original.asset.precision,
        maximumFractionDigits: row.original.asset.precision,
      }).format(amount);
      return (
        <div className="flex items-center justify-center">
          <AlertDialog>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost">
                  <span className="sr-only">Open menu</span>
                  <EllipsisVertical />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Pencil />
                  {/* TODO */}
                  Edit
                </DropdownMenuItem>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem>
                    <Trash2 />
                    Delete
                  </DropdownMenuItem>
                </AlertDialogTrigger>
              </DropdownMenuContent>
            </DropdownMenu>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Capital Transaction</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this capital transaction?
                  <br />
                  {`${format(new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()), 'yyyy/MM/dd')}: ${formattedAmount} ${transaction.asset.ticker}`}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Back</AlertDialogCancel>
                <form
                  action={async () => {
                    await removeCapitalTransaction(
                      transaction.capitalTransaction.id,
                    );
                  }}
                >
                  <AlertDialogAction type="submit">Delete</AlertDialogAction>
                </form>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      );
    },
  },
];

export default function CapitalDataTable({ data }: { data: Transaction[] }) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="space-y-4">
      <div className="rounded-lg border">
        <DataTable table={table} gridLines />
      </div>
      <DataTablePagination
        table={table}
        pageSizes={[10, 20, 50, 100]}
        showSelected={false}
      />
    </div>
  );
}
