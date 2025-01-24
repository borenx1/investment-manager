/**
 * This file contains resuable queries that should not be called directly from
 * components or server actions. These queries do not check if they are called
 * from the correct authenticated user and do not check for data integrity,
 * e.g. a ledger linked to a portfolio account and an asset that doesn't belong
 * to the same user.
 */

import { db } from './';
import {
  balances,
  ledgers,
  SelectAsset,
  SelectPortfolioAccount,
} from './schema';

/**
 * Create the balance and ledgers for the given portfolio account and asset in
 * the database if they do not exist already. DOES NOT CHECK IF THE ACCOUNT AND
 * ASSET BELONG TO THE SAME USER.
 * @param portfolioAccountId The portfolio account ID.
 * @param assetId The asset ID.
 */
export async function createBalanceAndLedgers(
  portfolioAccountId: SelectPortfolioAccount['id'],
  assetId: SelectAsset['id'],
) {
  const results = await Promise.allSettled([
    db
      .insert(balances)
      .values({ portfolioAccountId, assetId })
      .onConflictDoNothing(),
    db
      .insert(ledgers)
      .values({ portfolioAccountId, assetId, type: 'asset' })
      .onConflictDoNothing(),
    db
      .insert(ledgers)
      .values({ portfolioAccountId, assetId, type: 'liability' })
      .onConflictDoNothing(),
    db
      .insert(ledgers)
      .values({ portfolioAccountId, assetId, type: 'capital' })
      .onConflictDoNothing(),
    db
      .insert(ledgers)
      .values({ portfolioAccountId, assetId, type: 'income' })
      .onConflictDoNothing(),
  ]);
  // TODO: Log errors.
  results.forEach((result) => {
    if (result.status === 'rejected') {
      console.error(result.reason);
    }
  });
}
