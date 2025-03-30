'use client';

import { useMemo } from 'react';
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts';
import { format } from 'date-fns';

import type { SelectAsset } from '@/db/schema';
import { filterByDate } from '@/lib/filters';
import { cn, formatDecimalPlaces } from '@/lib/utils';
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import type { AssetPrice } from '@/components/AddEditAssetPriceDialog';
import type { DateFilterValue } from '@/components/DateFilter';

const chartConfig = {
  price: {
    label: 'Price',
  },
} satisfies ChartConfig;

export default function PriceChart({
  data,
  asset,
  quoteAsset,
  dateFilter,
  className,
  ...props
}: {
  data: AssetPrice[];
  asset: SelectAsset;
  quoteAsset: SelectAsset;
  dateFilter?: DateFilterValue;
} & React.ComponentProps<'div'>) {
  const filteredData = useMemo(() => {
    if (asset.id === quoteAsset.id) {
      return [];
    }
    return data
      .map(({ price }) => ({
        ...price,
        dateString: price.date,
        date: new Date(`${price.date} 00:00:00`),
      }))
      .filter((price) => {
        if (price.assetId !== asset.id || price.quoteAssetId !== quoteAsset.id) {
          return false;
        }
        return filterByDate(price.date, dateFilter);
      });
  }, [data, asset, quoteAsset, dateFilter]);
  const chartData = useMemo(() => {
    return filteredData.map((price) => ({
      date: price.date.getTime(),
      price: Number(price.price),
    }));
  }, [filteredData]);

  return chartData.length ? (
    <ChartContainer config={chartConfig} className={cn('w-full', className)} {...props}>
      <LineChart accessibilityLayer data={chartData} margin={{ top: 20, right: 20 }}>
        <CartesianGrid />
        <XAxis
          dataKey="date"
          type="number"
          scale="time"
          domain={['dataMin', 'dataMax']}
          tickMargin={10}
          tickFormatter={(value) => format(value, 'yy/MM/dd')}
        />
        <YAxis
          type="number"
          domain={([dataMin, dataMax]) => {
            if (!isFinite(dataMin) || !isFinite(dataMax)) {
              return [-Infinity, Infinity];
            }
            const range = Math.abs(dataMax - dataMin);
            return [Math.max(dataMin - range * 0.2, 0), dataMax + range * 0.2];
          }}
          tickFormatter={(value) =>
            formatDecimalPlaces(Number(value), asset.pricePrecision, {
              maximumSignificantDigits: 6,
            })
          }
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              hideIndicator
              labelFormatter={(_, payload) => format(payload[0]!.payload.date, 'yyyy/MM/dd')}
              valueFormatter={(value) => formatDecimalPlaces(Number(value), asset.pricePrecision)}
            />
          }
        />
        <Line dataKey="price" type="linear" animationDuration={300} />
      </LineChart>
    </ChartContainer>
  ) : (
    <div className={cn('grid place-items-center rounded-lg border', className)} {...props}>
      <div className="p-4 text-center sm:text-lg">
        {asset.id === quoteAsset.id
          ? 'Select a different asset and quote to see prices'
          : `No prices found for ${asset.ticker} / ${quoteAsset.ticker}`}
      </div>
    </div>
  );
}
