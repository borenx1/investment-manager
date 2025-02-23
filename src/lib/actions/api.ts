'use server';

import { getLatestDate as getLatestDateApi } from '@/lib/services/currency-api';

/**
 * Fetches the latest date from the currency exchange API.
 * @returns The latest date in YYYY-MM-DD format.
 */
export async function getLatestDate() {
  return getLatestDateApi();
}
