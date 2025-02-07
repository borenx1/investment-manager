'use client';

import { use, useMemo, useState } from 'react';
import { format } from 'date-fns';
import {
  ColumnDef,
  type ColumnFiltersState,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  CircleDollarSign,
  EllipsisVertical,
  Pencil,
  Trash2,
  X,
} from 'lucide-react';

import { removeIncomeTransaction } from '@/lib/actions';
import { convertUTCDate, extractDate, formatDecimalPlaces } from '@/lib/utils';
import { AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useResourceStore } from '@/providers/resource-store-provider';
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
import ActionAlertDialog from '@/components/ActionAlertDialog';
import AddEditIncomeTransactionDialog, {
  type Transaction,
} from '@/components/AddEditIncomeTransactionDialog';
import DateFilter, { type DateFilterValue } from '@/components/DateFilter';
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
    filterFn: (row, _, filterValue: DateFilterValue) => {
      if (filterValue) {
        const date = row.original.transaction.date;
        const localDate = convertUTCDate(date);
        if (filterValue.mode === 'from') {
          return localDate >= extractDate(filterValue.date);
        } else if (filterValue.mode === 'to') {
          return localDate <= extractDate(filterValue.date);
        } else if (filterValue.mode === 'range') {
          if (filterValue.from && filterValue.to) {
            return (
              localDate >= extractDate(filterValue.from) &&
              localDate <= extractDate(filterValue.to)
            );
          }
        }
      }
      return true;
    },
  },
  {
    accessorKey: 'portfolioAccount.name',
    header: 'Account',
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
    accessorKey: 'transaction.description',
    header: 'Notes',
    minSize: 150,
    maxSize: 300,
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const tx = row.original;
      const date = tx.transaction.date;
      const formattedAmount = formatDecimalPlaces(
        parseFloat(tx.assetEntry.amount),
        tx.asset.precision,
      );
      return (
        <div className="flex items-center justify-center">
          <AddEditIncomeTransactionDialog transaction={tx}>
            <ActionAlertDialog
              title="Delete Income Transaction"
              description={
                <>
                  Are you sure you want to delete this income transaction?
                  <br />
                  {`${format(convertUTCDate(date), 'yyyy/MM/dd')}: ${formattedAmount} ${tx.asset.ticker}`}
                </>
              }
              actionText="Delete"
              cancelText="Back"
              onAction={async () =>
                await removeIncomeTransaction(tx.incomeTransaction.id)
              }
            >
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
            </ActionAlertDialog>
          </AddEditIncomeTransactionDialog>
        </div>
      );
    },
  },
];

export default function IncomeTable({
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
  const [dateFilter, setDateFilter] = useState<DateFilterValue>();
  const columnFilters = useMemo<ColumnFiltersState>(() => {
    const filters: ColumnFiltersState = [];
    if (activeAccount) {
      filters.push({ id: 'portfolioAccount_name', value: activeAccount.id });
    }
    if (assetFilter.length) {
      filters.push({ id: 'asset_ticker', value: assetFilter });
    }
    if (dateFilter) {
      filters.push({ id: 'transaction_date', value: dateFilter });
    }
    return filters;
  }, [activeAccount, assetFilter, dateFilter]);
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    initialState: { pagination: { pageSize: 20 } },
    state: { columnFilters },
  });

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
        <DateFilter name="Date" value={dateFilter} onChange={setDateFilter} />
        {!!(assetFilter.length || dateFilter) && (
          <Button
            variant="outline"
            onClick={() => {
              setAssetFilter([]);
              setDateFilter(undefined);
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

export function IncomeTableSkeleton() {
  return (
    <div className="space-y-2 overflow-hidden">
      <Skeleton className="h-[40px] max-w-[400px]" />
      {[...Array(10)].map((_, i) => (
        <Skeleton key={i} className="h-[40px]" />
      ))}
    </div>
  );
}
