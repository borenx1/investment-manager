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
  ArrowDownToLine,
  ArrowUpDown,
  ArrowUpToLine,
  Banknote,
  CircleDollarSign,
  EllipsisVertical,
  Pencil,
  Trash2,
  X,
} from 'lucide-react';

import { removeTradeTransaction } from '@/lib/actions';
import { convertUTCDate, extractDate, formatDecimalPlaces } from '@/lib/utils';
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
import AddEditTradeTransactionDialog, {
  type Transaction,
} from '@/components/AddEditTradeTransactionDialog';
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
    id: 'asset_pair',
    header: 'Asset',
    accessorFn: (row) => `${row.baseAsset.ticker} / ${row.quoteAsset.ticker}`,
    filterFn: (row, _, filterValue) => {
      if (
        typeof filterValue === 'object' &&
        Array.isArray(filterValue.base) &&
        Array.isArray(filterValue.quote)
      ) {
        if (filterValue.base.length) {
          const isBaseMatch = filterValue.base.some(
            (value: { id: number }) => row.original.baseAsset.id === value?.id,
          );
          if (!isBaseMatch) {
            return false;
          }
        }
        if (filterValue.quote.length) {
          const isQuoteMatch = filterValue.quote.some(
            (value: { id: number }) => row.original.quoteAsset.id === value?.id,
          );
          if (!isQuoteMatch) {
            return false;
          }
        }
        return true;
      }
      return true;
    },
  },
  {
    accessorKey: 'baseAssetEntry.amount',
    header: () => <div className="text-right">Amount</div>,
    cell: ({ row }) => {
      const amount = Math.abs(parseFloat(row.original.baseAssetEntry.amount));
      const formatted = formatDecimalPlaces(
        amount,
        row.original.baseAsset.precision,
      );
      return <div className="text-right font-mono">{formatted}</div>;
    },
    minSize: 80,
  },
  {
    accessorKey: 'quoteAssetEntry.amount',
    header: () => <div className="text-right">Total</div>,
    cell: ({ row }) => {
      const amount = Math.abs(parseFloat(row.original.quoteAssetEntry.amount));
      const formatted = formatDecimalPlaces(
        amount,
        row.original.quoteAsset.precision,
      );
      return <div className="text-right font-mono">{formatted}</div>;
    },
    minSize: 80,
  },
  {
    id: 'price',
    accessorFn: (row) => {
      const baseAmount = parseFloat(row.baseAssetEntry.amount);
      const quoteAmount = parseFloat(row.quoteAssetEntry.amount);
      return baseAmount !== 0 ? Math.abs(quoteAmount / baseAmount) : 0;
    },
    header: () => <div className="text-right">Price</div>,
    cell: ({ row }) => {
      const baseAmount = parseFloat(row.original.baseAssetEntry.amount);
      const quoteAmount = parseFloat(row.original.quoteAssetEntry.amount);
      const price = baseAmount !== 0 ? Math.abs(quoteAmount / baseAmount) : 0;
      const formatted = formatDecimalPlaces(
        price,
        row.original.baseAsset.pricePrecision,
        { trailingZeros: false },
      );
      return <div className="text-right font-mono">{formatted}</div>;
    },
  },
  {
    id: 'feeAsset_ticker',
    accessorFn: (row) => row.feeAsset?.ticker,
    header: 'Fee curr.',
    cell: ({ row }) => {
      if (!row.original.feeAsset) {
        return '';
      }
      return (
        <div>
          {row.original.feeAsset.id === row.original.baseAsset.id
            ? 'Base'
            : 'Quote'}
        </div>
      );
    },
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
        row.original.feeAsset!.precision,
      );
      return <div className="text-right font-mono">{formatted}</div>;
    },
  },
  {
    id: 'type',
    header: 'Type',
    cell: ({ row }) => {
      const amount = parseFloat(row.original.baseAssetEntry.amount);
      return (
        <div className="flex items-center justify-center">
          {amount >= 0 ? (
            <Badge className="bg-green-700 text-green-100 hover:bg-green-700/80">
              Buy
            </Badge>
          ) : (
            <Badge variant="destructive">Sell</Badge>
          )}
        </div>
      );
    },
    filterFn: (row, _, filterValue) => {
      if (Array.isArray(filterValue)) {
        return filterValue.some((value) => {
          const amount = parseFloat(row.original.baseAssetEntry.amount);
          if (value.value === 'buy') {
            return amount >= 0;
          } else if (value.value === 'sell') {
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
      const baseAmount = parseFloat(tx.baseAssetEntry.amount);
      const quoteAmount = parseFloat(tx.quoteAssetEntry.amount);
      const formattedBaseAmount = formatDecimalPlaces(
        Math.abs(baseAmount),
        tx.baseAsset.precision,
      );
      const formattedQuoteAmount = formatDecimalPlaces(
        Math.abs(quoteAmount),
        tx.quoteAsset.precision,
      );
      const buyOrSell = baseAmount >= 0 ? 'Buy' : 'Sell';
      return (
        <div className="flex items-center justify-center">
          <AddEditTradeTransactionDialog transaction={tx}>
            <ActionAlertDialog
              title="Delete Trade Transaction"
              description={
                <>
                  Are you sure you want to delete this trade transaction?
                  <br />
                  {`${format(convertUTCDate(date), 'yyyy/MM/dd')}: `}
                  {`${buyOrSell} ${formattedBaseAmount} ${tx.baseAsset.ticker} `}
                  {`for ${formattedQuoteAmount} ${tx.quoteAsset.ticker}`}
                </>
              }
              actionText="Delete"
              cancelText="Back"
              onAction={async () =>
                await removeTradeTransaction(tx.tradeTransaction.id)
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
          </AddEditTradeTransactionDialog>
        </div>
      );
    },
  },
];

export default function TradeTable({
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
  const [dateFilter, setDateFilter] = useState<DateFilterValue>();
  const [baseAssetFilter, setBaseAssetFilter] = useState<typeof assetOptions>(
    [],
  );
  const [quoteAssetFilter, setQuoteAssetFilter] = useState<typeof assetOptions>(
    [],
  );
  const typeOptions = useMemo(
    () =>
      [
        { value: 'buy', label: 'Buy', icon: ArrowDownToLine },
        { value: 'sell', label: 'Sell', icon: ArrowUpToLine },
      ] as const,
    [],
  );
  const [typeFilter, setTypeFilter] = useState<(typeof typeOptions)[number][]>(
    [],
  );
  const columnFilters = useMemo<ColumnFiltersState>(() => {
    const filters: ColumnFiltersState = [];
    if (activeAccount) {
      filters.push({ id: 'portfolioAccount_name', value: activeAccount.id });
    }
    if (dateFilter) {
      filters.push({ id: 'transaction_date', value: dateFilter });
    }
    if (baseAssetFilter.length || quoteAssetFilter.length) {
      filters.push({
        id: 'asset_pair',
        value: { base: baseAssetFilter, quote: quoteAssetFilter },
      });
    }
    if (typeFilter.length) {
      filters.push({ id: 'type', value: typeFilter });
    }
    return filters;
  }, [
    activeAccount,
    dateFilter,
    baseAssetFilter,
    quoteAssetFilter,
    typeFilter,
  ]);
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
          values={baseAssetFilter}
          onChange={setBaseAssetFilter}
        />
        <SelectFilter
          name="Quote"
          icon={Banknote}
          options={assetOptions}
          values={quoteAssetFilter}
          onChange={setQuoteAssetFilter}
        />
        <SelectFilter
          name="Type"
          icon={ArrowUpDown}
          options={typeOptions}
          values={typeFilter}
          onChange={setTypeFilter}
        />
        {!!(
          dateFilter ||
          baseAssetFilter.length ||
          quoteAssetFilter.length ||
          typeFilter.length
        ) && (
          <Button
            variant="outline"
            onClick={() => {
              setDateFilter(undefined);
              setBaseAssetFilter([]);
              setQuoteAssetFilter([]);
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

export function TradeTableSkeleton() {
  return (
    <div className="space-y-2 overflow-hidden">
      <Skeleton className="h-[40px] max-w-[400px]" />
      {[...Array(10)].map((_, i) => (
        <Skeleton key={i} className="h-[40px]" />
      ))}
    </div>
  );
}
