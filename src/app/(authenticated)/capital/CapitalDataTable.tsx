'use client';

import { use, useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import {
  ColumnDef,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  ArrowUpDown,
  CircleDollarSign,
  EllipsisVertical,
  Minus,
  Pencil,
  Plus,
  Trash2,
  X,
} from 'lucide-react';

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
import { useResourceStore } from '@/providers/resource-store-provider';
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
import SelectFilter from '@/components/SelectFilter';

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
    header: 'Account',
    minSize: 80,
    filterFn: (row, _, filterValue) => {
      if (typeof filterValue === 'number') {
        return row.original.portfolioAccount.id === filterValue;
      } else if (typeof filterValue === 'string') {
        return String(row.original.portfolioAccount.id) === filterValue;
      }
      return true;
    },
  },
  {
    accessorKey: 'asset.ticker',
    header: 'Asset',
    filterFn: (row, _, filterValue) => {
      if (Array.isArray(filterValue)) {
        return filterValue.some((value) => row.original.asset.id === value?.id);
      } else if (typeof filterValue === 'number') {
        return row.original.asset.id === filterValue;
      } else if (typeof filterValue === 'string') {
        return String(row.original.asset.id) === filterValue;
      }
      return true;
    },
  },
  {
    accessorKey: 'assetEntry.amount',
    header: () => <div className="text-right">Amount</div>,
    cell: ({ row }) => {
      const amount = parseFloat(row.original.assetEntry.amount);
      const formatted = formatDecimalPlaces(
        amount,
        row.original.asset.precision,
      );
      return <div className="text-right font-mono">{formatted}</div>;
    },
    minSize: 80,
  },
  {
    id: 'feeIncomeEntry_amount',
    accessorFn: (row) => row.feeIncomeEntry?.amount,
    header: () => <div className="text-right">Fee</div>,
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
    minSize: 80,
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
    filterFn: (row, _, filterValue) => {
      if (Array.isArray(filterValue)) {
        return filterValue.some((value) => {
          const amount = parseFloat(row.original.assetEntry.amount);
          if (value.value === 'contributions') {
            return amount >= 0;
          } else if (value.value === 'drawings') {
            return amount < 0;
          }
          return true;
        });
      }
      return true;
    },
  },
  {
    accessorKey: 'transaction.description',
    header: 'Notes',
    minSize: 150,
    maxSize: 300,
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
  const activeAccount = useResourceStore((state) => state.activeAccount);
  const assets = useResourceStore((state) => state.assets);
  const assetOptions = useMemo(
    () =>
      assets.map((asset) => ({
        ...asset,
        value: String(asset.id),
        label: asset.ticker,
      })),
    [assets],
  );
  const [assetFilter, setAssetFilter] = useState<typeof assetOptions>([]);
  const typeOptions = useMemo(
    () =>
      [
        { value: 'contributions', label: 'Contributions', icon: Plus },
        { value: 'drawings', label: 'Drawings', icon: Minus },
      ] as const,
    [],
  );
  const [typeFilter, setTypeFilter] = useState<(typeof typeOptions)[number][]>(
    [],
  );
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    initialState: { pagination: { pageSize: 20 } },
  });

  useEffect(() => {
    table.getColumn('portfolioAccount_name')?.setFilterValue(activeAccount?.id);
  }, [table, activeAccount]);
  useEffect(() => {
    table
      .getColumn('asset_ticker')
      ?.setFilterValue(assetFilter.length ? assetFilter : undefined);
  }, [table, assetFilter]);
  useEffect(() => {
    table
      .getColumn('type')
      ?.setFilterValue(typeFilter.length ? typeFilter : undefined);
  }, [table, typeFilter]);

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <SelectFilter
          name="Asset"
          icon={CircleDollarSign}
          options={assetOptions}
          values={assetFilter}
          onChange={setAssetFilter}
        />
        <SelectFilter
          name="Type"
          icon={ArrowUpDown}
          options={typeOptions}
          values={typeFilter}
          onChange={setTypeFilter}
        />
        {!!(assetFilter.length || typeFilter.length) && (
          <Button
            variant="outline"
            onClick={() => {
              setAssetFilter([]);
              setTypeFilter([]);
            }}
          >
            Reset
            <X />
          </Button>
        )}
      </div>
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
