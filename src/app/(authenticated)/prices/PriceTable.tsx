'use client';

import { useMemo } from 'react';
import { format } from 'date-fns';
import {
  type ColumnDef,
  type ColumnFiltersState,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { Check, EllipsisVertical, Pencil, Plus, Trash2 } from 'lucide-react';

import type { SelectAsset } from '@/db/schema';
import { removeAssetPrice } from '@/lib/actions';
import { filterByDate } from '@/lib/filters';
import { formatDecimalPlaces } from '@/lib/utils';
import { useResourceStore } from '@/providers/resource-store-provider';
import { AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { DialogTrigger } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import ActionAlertDialog from '@/components/ActionAlertDialog';
import AddEditAssetPriceDialog, {
  type AssetPrice,
} from '@/components/AddEditAssetPriceDialog';
import type { DateFilterValue } from '@/components/DateFilter';

export const columns: ColumnDef<AssetPrice>[] = [
  {
    accessorKey: 'price.date',
    header: 'Date',
    cell: ({ row }) => {
      const date = new Date(`${row.original.price.date} 00:00:00`);
      return <div className="font-mono">{format(date, 'yyyy/MM/dd')}</div>;
    },
    filterFn: (row, _, filterValue: DateFilterValue) => {
      if (filterValue) {
        const date = new Date(`${row.original.price.date} 00:00:00`);
        return filterByDate(date, filterValue);
      }
      return true;
    },
  },
  {
    accessorKey: 'price.price',
    header: () => <div className="text-right">Price</div>,
    cell: ({ row }) => {
      const price = parseFloat(row.original.price.price);
      const formatted = formatDecimalPlaces(
        price,
        row.original.asset.pricePrecision,
      );
      return <div className="text-right font-mono">{formatted}</div>;
    },
    minSize: 100,
  },
  {
    accessorKey: 'price.isGenerated',
    header: () => <div className="text-center">Generated</div>,
    cell: ({ row }) => {
      return (
        <div className="text-center">
          {row.original.price.isGenerated && <Check className="size-4" />}
          <span className="sr-only">
            {row.original.price.isGenerated ? 'Yes' : 'No'}
          </span>
        </div>
      );
    },
  },
  {
    id: 'actions',
    cell: ({ row, table }) => {
      const date = new Date(`${row.original.price.date} 00:00:00`);
      const price = parseFloat(row.original.price.price);
      const formattedPrice = formatDecimalPlaces(
        price,
        row.original.asset.pricePrecision,
      );
      const asset = row.original.asset;
      const quote = row.original.quote;
      return (
        <div className="flex items-center justify-center">
          <AddEditAssetPriceDialog
            asset={row.original.asset}
            quoteAsset={row.original.quote}
            prices={table.options.data}
            date={date}
          >
            <ActionAlertDialog
              title="Delete Price"
              description={
                <>
                  Are you sure you want to delete this price?
                  <br />
                  {`${asset.ticker} / ${quote.ticker}: ${format(date, 'yyyy/MM/dd')}: ${formattedPrice}`}
                </>
              }
              actionText="Delete"
              cancelText="Back"
              onAction={async () =>
                await removeAssetPrice(row.original.price.id)
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
          </AddEditAssetPriceDialog>
        </div>
      );
    },
  },
];

export default function PriceTable({
  data,
  asset,
  quoteAsset,
  dateFilter,
}: {
  data: AssetPrice[];
  asset: SelectAsset;
  quoteAsset: SelectAsset;
  dateFilter?: DateFilterValue;
}) {
  const accountingCurrency = useResourceStore(
    (state) => state.accountingCurrency,
  );
  // Assume data is sorted by date increasing.
  const sortedData = useMemo(() => {
    if (asset.id === quoteAsset.id) {
      return [];
    }
    return [...data].reverse();
  }, [data, asset, quoteAsset]);
  const columnFilters = useMemo<ColumnFiltersState>(() => {
    const filters: ColumnFiltersState = [];
    if (dateFilter) {
      filters.push({ id: 'price_date', value: dateFilter });
    }
    return filters;
  }, [dateFilter]);
  const table = useReactTable({
    data: sortedData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: { columnFilters },
  });

  return (
    <div className="space-y-4">
      <AddEditAssetPriceDialog
        asset={asset}
        quoteAsset={quoteAsset}
        prices={sortedData}
      >
        <DialogTrigger asChild>
          <Button
            disabled={
              asset.id === quoteAsset.id ||
              quoteAsset.id !== accountingCurrency?.id
            }
          >
            <Plus />
            Add new price
          </Button>
        </DialogTrigger>
      </AddEditAssetPriceDialog>

      <div className="rounded-lg border">
        <DataTable table={table} />
      </div>
    </div>
  );
}
