'use server';

import { revalidatePath } from 'next/cache';

import { auth } from '@/auth';
import { createAssetPrices, getAsset, getAssetPrices } from '@/db/queries';
import {
  getCurrencyApiLatestDate,
  getCurrencyPrices,
  getSupportedCurrencies,
} from '@/lib/services/currency-api';
import { getDateList } from '@/lib/utils';

/**
 * Fetches the latest date from the currency exchange API.
 * @returns The latest date in YYYY-MM-DD format.
 */
export async function fetchCurrencyApiLatestDate() {
  return getCurrencyApiLatestDate();
}

/**
 * Generate prices for an asset from external data.
 * @param data The data for generating prices.
 * @returns The generated prices.
 */
export async function generatePrices(data: {
  assetId: number;
  quoteAssetId: number;
  fromDate: Date;
  toDate: Date;
  frequency: 'month-start' | 'month-end' | 'all';
  overwriteExisting: boolean;
}) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { message: 'Unauthorized' } as const;

  if (data.assetId === data.quoteAssetId) {
    return { message: 'Asset and quote asset cannot be the same' } as const;
  }

  const [baseAsset, quoteAsset, supportedCurrencies, apiLatestDateString] = await Promise.all([
    getAsset(userId, data.assetId),
    getAsset(userId, data.quoteAssetId),
    getSupportedCurrencies(),
    getCurrencyApiLatestDate(),
  ]);
  if (!baseAsset || !quoteAsset) {
    return { message: 'Asset does not exist' } as const;
  }
  if (
    !baseAsset.externalTicker ||
    !(baseAsset.externalTicker in supportedCurrencies) ||
    !quoteAsset.externalTicker ||
    !(quoteAsset.externalTicker in supportedCurrencies)
  ) {
    return { message: 'Asset does not have a valid external ticker' } as const;
  }

  const apiLatestDate = new Date(`${apiLatestDateString} 00:00:00`);
  // Cap the to date to the latest date from the API.
  const toDate = data.toDate < apiLatestDate ? data.toDate : apiLatestDate;
  let dates = getDateList(data.fromDate, toDate, data.frequency);
  if (dates.length === 0) {
    return { message: 'No dates to generate prices for' } as const;
  }

  if (!data.overwriteExisting) {
    const existingPrices = await getAssetPrices(userId, {
      assetId: data.assetId,
      quoteAssetId: data.quoteAssetId,
    });
    dates = dates.filter((date) => !existingPrices.some(({ price }) => price.date === date));
    if (dates.length === 0) {
      return { message: 'No new prices to generate' } as const;
    }
  }

  const apiPrices = await getCurrencyPrices(
    baseAsset.externalTicker,
    quoteAsset.externalTicker,
    dates,
  );

  const newPrices = await createAssetPrices(
    userId,
    data.assetId,
    data.quoteAssetId,
    true,
    Object.entries(apiPrices).map(([date, price]) => ({ date, price })),
  );

  revalidatePath('/prices');
  return newPrices;
}
