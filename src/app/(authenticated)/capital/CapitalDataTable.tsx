'use client';

import { use } from 'react';
import { format } from 'date-fns';
import {
  ColumnDef,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { EllipsisVertical, Pencil, Trash2 } from 'lucide-react';

import { removeCapitalTransaction } from '@/lib/actions';
import { convertUTCDate, formatDecimalPlaces } from '@/lib/utils';
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable, DataTablePagination } from '@/components/ui/data-table';
import { DialogTrigger } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import AddEditCapitalTransactionDialog, {
  type Transaction,
} from '@/components/AddEditCapitalTransactionDIalog';

export const columns: ColumnDef<Transaction>[] = [
  {
    accessorKey: 'transaction.date',
    header: 'Date',
    cell: ({ row }) => {
      const date = row.original.transaction.date;
      return (
        <div className="font-mono">
          {format(convertUTCDate(date), 'yyyy/MM/dd')}
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
      const formatted = formatDecimalPlaces(
        amount,
        row.original.asset.precision,
      );
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
      const formatted = formatDecimalPlaces(
        amount,
        row.original.asset.precision,
      );
      return <div className="text-right font-mono">{formatted}</div>;
    },
  },
  {
    id: 'type',
    header: 'Type',
    cell: ({ row }) => {
      const amount = parseFloat(row.original.assetEntry.amount);
      return (
        <div className="flex items-center justify-center">
          {amount >= 0 ? (
            <Badge className="bg-green-700 text-green-100 hover:bg-green-700/80">
              Contributions
            </Badge>
          ) : (
            <Badge variant="destructive">Drawings</Badge>
          )}
        </div>
      );
    },
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
      const formattedAmount = formatDecimalPlaces(
        parseFloat(transaction.assetEntry.amount),
        row.original.asset.precision,
      );
      return (
        <div className="flex items-center justify-center">
          <AddEditCapitalTransactionDialog transaction={transaction}>
            <AlertDialog>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost">
                    <span className="sr-only">Open menu</span>
                    <EllipsisVertical />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DialogTrigger asChild>
                    <DropdownMenuItem>
                      <Pencil />
                      Edit
                    </DropdownMenuItem>
                  </DialogTrigger>
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
                  <AlertDialogTitle>
                    Delete Capital Transaction
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this capital transaction?
                    <br />
                    {`${format(convertUTCDate(date), 'yyyy/MM/dd')}: ${formattedAmount} ${transaction.asset.ticker}`}
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
          </AddEditCapitalTransactionDialog>
        </div>
      );
    },
  },
];

export default function CapitalDataTable({
  data: dataPromise,
}: {
  data: Promise<Transaction[]>;
}) {
  const data = use(dataPromise);
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

export function CapitalDataTableSkeleton() {
  return (
    <div className="space-y-2 overflow-hidden">
      {[...Array(10)].map((_, i) => (
        <Skeleton key={i} className="h-[40px]" />
      ))}
    </div>
  );
}
