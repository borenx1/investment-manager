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
  CircleDollarSign,
  EllipsisVertical,
  Pencil,
  Trash2,
  X,
} from 'lucide-react';

import { removeAccountTransferTx } from '@/lib/actions';
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
import AddEditAccountTransferTxDialog, {
  type Transaction,
} from '@/components/AddEditAccountTransferTxDialog';
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
    accessorKey: 'sourcePortfolioAccount.name',
    header: 'Source',
    minSize: 80,
    filterFn: (row, _, filterValue) => {
      // Filter both source AND target portfolio accounts.
      if (typeof filterValue === 'number') {
        return [
          row.original.sourcePortfolioAccount.id,
          row.original.targetPortfolioAccount.id,
        ].includes(filterValue);
      } else if (typeof filterValue === 'string') {
        return [
          String(row.original.sourcePortfolioAccount.id),
          String(row.original.targetPortfolioAccount.id),
        ].includes(filterValue);
      }
      return true;
    },
  },
  {
    accessorKey: 'targetPortfolioAccount.name',
    header: 'Target',
    minSize: 80,
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
    accessorKey: 'targetAssetEntry.amount',
    header: () => <div className="text-right">Amount</div>,
    cell: ({ row }) => {
      const amount = parseFloat(row.original.targetAssetEntry.amount);
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
        parseFloat(transaction.targetAssetEntry.amount),
        row.original.asset.precision,
      );
      return (
        <div className="flex items-center justify-center">
          <AddEditAccountTransferTxDialog transaction={transaction}>
            <ActionAlertDialog
              title="Delete Account Transfer"
              description={
                <>
                  Are you sure you want to delete this account transfer
                  transaction?
                  <br />
                  {`${format(convertUTCDate(date), 'yyyy/MM/dd')}: ${formattedAmount} ${transaction.asset.ticker}`}
                </>
              }
              actionText="Delete"
              cancelText="Back"
              onAction={async () =>
                await removeAccountTransferTx(
                  transaction.accountTransferTransaction.id,
                )
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
          </AddEditAccountTransferTxDialog>
        </div>
      );
    },
  },
];

export default function AccountTransferTable({
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
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    initialState: { pagination: { pageSize: 20 } },
  });

  useEffect(() => {
    table
      .getColumn('sourcePortfolioAccount_name')
      ?.setFilterValue(activeAccount?.id);
  }, [table, activeAccount]);
  useEffect(() => {
    table
      .getColumn('asset_ticker')
      ?.setFilterValue(assetFilter.length ? assetFilter : undefined);
  }, [table, assetFilter]);
  useEffect(() => {
    table.getColumn('transaction_date')?.setFilterValue(dateFilter);
  }, [table, dateFilter]);

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

export function AccountTransferTableSkeleton() {
  return (
    <div className="space-y-2 overflow-hidden">
      <Skeleton className="h-[40px] max-w-[400px]" />
      {[...Array(10)].map((_, i) => (
        <Skeleton key={i} className="h-[40px]" />
      ))}
    </div>
  );
}
