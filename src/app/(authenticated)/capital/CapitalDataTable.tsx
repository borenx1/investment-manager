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
import { filterByDate } from '@/lib/filters';
import { convertUTCDate, formatDecimalPlaces } from '@/lib/utils';
import { AlertDialogTrigger } from '@/components/ui/alert-dialog';
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
import ActionAlertDialog from '@/components/ActionAlertDialog';
import AddEditCapitalTransactionDialog, {
  type Transaction,
} from '@/components/AddEditCapitalTransactionDialog';
import DateFilter, { type DateFilterValue } from '@/components/DateFilter';
import SelectFilter from '@/components/SelectFilter';

export const columns: ColumnDef<Transaction>[] = [
  {
    accessorKey: 'transaction.date',
    header: 'Date',
    cell: ({ row }) => {
      const date = row.original.transaction.date;
      return <div className="font-mono">{format(convertUTCDate(date), 'yyyy/MM/dd')}</div>;
    },
    filterFn: (row, _, filterValue: DateFilterValue) => {
      if (filterValue) {
        const localDate = convertUTCDate(row.original.transaction.date);
        return filterByDate(localDate, filterValue);
      }
      return true;
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
      const formatted = formatDecimalPlaces(amount, row.original.asset.precision);
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
      const formatted = formatDecimalPlaces(amount, row.original.asset.precision);
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
            <Badge className="bg-green-700 text-green-100">Contributions</Badge>
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
      const tx = row.original;
      const date = tx.transaction.date;
      const formattedAmount = formatDecimalPlaces(
        parseFloat(tx.assetEntry.amount),
        tx.asset.precision,
      );
      return (
        <div className="flex items-center justify-center">
          <AddEditCapitalTransactionDialog transaction={tx}>
            <ActionAlertDialog
              title="Delete Capital Transaction"
              description={
                <>
                  Are you sure you want to delete this capital transaction?
                  <br />
                  {`${format(convertUTCDate(date), 'yyyy/MM/dd')}: ${formattedAmount} ${tx.asset.ticker}`}
                </>
              }
              actionText="Delete"
              cancelText="Back"
              onAction={async () => await removeCapitalTransaction(tx.capitalTransaction.id)}
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
          </AddEditCapitalTransactionDialog>
        </div>
      );
    },
  },
];

export default function CapitalDataTable({ data: dataPromise }: { data: Promise<Transaction[]> }) {
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
  const typeOptions = useMemo(
    () =>
      [
        { value: 'contributions', label: 'Contributions', icon: Plus },
        { value: 'drawings', label: 'Drawings', icon: Minus },
      ] as const,
    [],
  );
  const [dateFilter, setDateFilter] = useState<DateFilterValue>();
  const [assetFilter, setAssetFilter] = useState<typeof assetOptions>([]);
  const [typeFilter, setTypeFilter] = useState<(typeof typeOptions)[number][]>([]);
  const columnFilters = useMemo<ColumnFiltersState>(() => {
    const filters: ColumnFiltersState = [];
    if (activeAccount) {
      filters.push({ id: 'portfolioAccount_name', value: activeAccount.id });
    }
    if (dateFilter) {
      filters.push({ id: 'transaction_date', value: dateFilter });
    }
    if (assetFilter.length) {
      filters.push({ id: 'asset_ticker', value: assetFilter });
    }
    if (typeFilter.length) {
      filters.push({ id: 'type', value: typeFilter });
    }
    return filters;
  }, [activeAccount, dateFilter, assetFilter, typeFilter]);
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
        <DateFilter name="Date" value={dateFilter} onChange={setDateFilter} />
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
        {!!(dateFilter || assetFilter.length || typeFilter.length) && (
          <Button
            variant="outline"
            onClick={() => {
              setDateFilter(undefined);
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
      <DataTablePagination table={table} pageSizes={[10, 20, 50, 100]} showSelected={false} />
    </div>
  );
}

export function CapitalDataTableSkeleton() {
  return (
    <div className="space-y-2 overflow-hidden">
      <Skeleton className="h-[40px] max-w-[400px]" />
      {[...Array(10)].map((_, i) => (
        <Skeleton key={i} className="h-[40px]" />
      ))}
    </div>
  );
}
