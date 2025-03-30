import 'server-only';
import { and, eq, inArray } from 'drizzle-orm';
import { z } from 'zod';

import { db } from './';
import { currencyApiPrices } from './schema';

/**
 * Get the cached Currency API prices from the database.
 * @param baseTicker The base currency ticker.
 * @param quoteTicker The quote currency ticker.
 * @param dates The dates to get the prices for.
 * @returns The cached prices from the database.
 */
export async function getCurrencyApiPricesFromDb(
  baseTicker: string,
  quoteTicker: string,
  dates: string[],
) {
  if (!dates.length) {
    return [];
  }
  const isDatesValid = z.array(z.string().date()).safeParse(dates).success;
  if (!isDatesValid) {
    throw new Error('Dates must be in YYYY-MM-DD format');
  }

  return await db
    .select()
    .from(currencyApiPrices)
    .where(
      and(
        eq(currencyApiPrices.baseTicker, baseTicker),
        eq(currencyApiPrices.quoteTicker, quoteTicker),
        inArray(currencyApiPrices.date, dates),
      ),
    )
    .orderBy(currencyApiPrices.date);
}

/**
 * Save the Currency API prices to the database.
 * @param baseTicker The base currency ticker.
 * @param quoteTicker The quote currency ticker.
 * @param prices The prices to save.
 * @returns The saved prices.
 */
export async function saveCurrencyApiPricesToDb(
  baseTicker: string,
  quoteTicker: string,
  prices: Record<string, number>,
) {
  const pricesData = Object.entries(prices).map(([date, price]) => ({
    baseTicker: baseTicker.trim().toLowerCase(),
    quoteTicker: quoteTicker.trim().toLowerCase(),
    date,
    price: String(price),
  }));
  if (pricesData.length === 0) {
    return [];
  }
  const isDatesValid = z.array(z.object({ date: z.string().date() })).safeParse(pricesData).success;
  if (!isDatesValid) {
    throw new Error('Dates must be in YYYY-MM-DD format');
  }

  return await db.insert(currencyApiPrices).values(pricesData).onConflictDoNothing().returning();
}
