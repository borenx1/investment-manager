'use client';

import { use, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { X } from 'lucide-react';

import type { SelectAsset, SelectAssetPrice } from '@/db/schema';
import { useResourceStore } from '@/providers/resource-store-provider';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import DateFilter, { type DateFilterValue } from '@/components/DateFilter';
import PriceChart from './PriceChart';
import PriceTable from './PriceTable';

export default function PriceSection({
  prices,
}: {
  prices: Promise<
    {
      price: SelectAssetPrice;
      asset: SelectAsset;
      quote: SelectAsset;
    }[]
  >;
}) {
  const data = use(prices);
  const assets = useResourceStore((state) => state.assets);
  const accountingCurrency = useResourceStore(
    (state) => state.accountingCurrency,
  );
  const isAssetsLoaded = useResourceStore((state) => state.isAssetsLoaded);
  const isAccountingCurrencyLoaded = useResourceStore(
    (state) => state.isAccountingCurrencyLoaded,
  );
  const isResourcesLoaded = useMemo(
    () => isAssetsLoaded && isAccountingCurrencyLoaded,
    [isAssetsLoaded, isAccountingCurrencyLoaded],
  );
  const [assetId, setAssetId] = useState<number | undefined>(
    assets.filter((a) => a.id !== accountingCurrency?.id)[0]?.id ??
      assets[0]?.id,
  );
  const [quoteId, setQuoteId] = useState<number | undefined>(
    accountingCurrency?.id,
  );
  const [dateFilter, setDateFilter] = useState<DateFilterValue>();
  const asset = useMemo(
    () => assets.find((asset) => asset.id === assetId),
    [assets, assetId],
  );
  const quote = useMemo(
    () => assets.find((asset) => asset.id === quoteId),
    [assets, quoteId],
  );
  const filteredPrices = useMemo(() => {
    if (!asset || !quote || asset.id === quote.id) {
      return [];
    }
    return data.filter(
      ({ price }) =>
        price.assetId === asset.id && price.quoteAssetId === quote.id,
    );
  }, [data, asset, quote]);

  // Set default values for asset and quote.
  useEffect(() => {
    if (isResourcesLoaded) {
      if (!assetId) {
        setAssetId(
          assets.filter((a) => a.id !== accountingCurrency?.id)[0]?.id ??
            assets[0]?.id,
        );
      }
      if (!quoteId) {
        setQuoteId(accountingCurrency?.id);
      }
    }
  }, [isResourcesLoaded, assets, accountingCurrency, assetId, quoteId]);

  return (
    <section className="space-y-4">
      {isResourcesLoaded ? (
        accountingCurrency ? (
          <>
            <div className="flex items-center gap-x-2">
              <Label htmlFor="asset">Asset</Label>
              <Select
                value={`${assetId}`}
                onValueChange={(value) => setAssetId(Number(value))}
              >
                <SelectTrigger id="asset" className="max-w-[120px]">
                  <SelectValue placeholder="Select an asset" />
                </SelectTrigger>
                <SelectContent>
                  {assets.map((option) => (
                    <SelectItem key={option.id} value={String(option.id)}>
                      {option.ticker}
                      {option.id === accountingCurrency?.id && ' (acc.)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Label htmlFor="quote" className="ml-2">
                Quote
              </Label>
              <Select
                value={`${quoteId}`}
                onValueChange={(value) => setQuoteId(Number(value))}
              >
                <SelectTrigger id="quote" className="max-w-[120px]">
                  <SelectValue placeholder="Select an asset" />
                </SelectTrigger>
                <SelectContent>
                  {assets.map((option) => (
                    <SelectItem key={option.id} value={String(option.id)}>
                      {option.ticker}
                      {option.id === accountingCurrency?.id && ' (acc.)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <DateFilter
                name="Date"
                value={dateFilter}
                onChange={setDateFilter}
              />
              {!!dateFilter && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setDateFilter(undefined);
                  }}
                >
                  Reset
                  <X />
                </Button>
              )}
            </div>
            {asset && quote ? (
              <div className="grid grid-cols-1 gap-x-4 gap-y-8 xl:grid-cols-5">
                <div className="xl:col-span-3">
                  <PriceChart
                    data={filteredPrices}
                    asset={asset}
                    quoteAsset={quote}
                    dateFilter={dateFilter}
                    className="max-h-[400px] min-h-[280px] xl:max-h-none xl:min-h-[500px]"
                  />
                </div>
                <div className="xl:col-span-2">
                  <PriceTable
                    data={filteredPrices}
                    asset={asset}
                    quoteAsset={quote}
                    dateFilter={dateFilter}
                  />
                </div>
              </div>
            ) : (
              <div className="italic">Please select an asset</div>
            )}
          </>
        ) : (
          <>
            <div className="italic">
              Please create an accounting currency in the settings
            </div>
            <Button asChild>
              <Link href="/settings">Go to settings</Link>
            </Button>
          </>
        )
      ) : (
        <PriceSectionSkeleton />
      )}
    </section>
  );
}

export function PriceSectionSkeleton() {
  // TODO
  return (
    <div className="space-y-2 overflow-hidden">
      <Skeleton className="h-[40px] max-w-[400px]" />
      {[...Array(10)].map((_, i) => (
        <Skeleton key={i} className="h-[40px]" />
      ))}
    </div>
  );
}
