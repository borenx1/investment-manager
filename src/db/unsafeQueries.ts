/**
 * This file contains resuable queries that should not be called directly from
 * components or server actions. These queries do not check if they are called
 * from the correct authenticated user and do not check for data integrity,
 * e.g. a ledger linked to a portfolio account and an asset that doesn't belong
 * to the same user.
 */

import 'server-only';
import { and, eq, sql } from 'drizzle-orm';

import { db } from './';
import {
  balances,
  ledgerEntries,
  ledgers,
  SelectAsset,
  SelectBalance,
  SelectLedger,
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
      .values([
        { portfolioAccountId, assetId, type: 'asset' },
        { portfolioAccountId, assetId, type: 'liability' },
        { portfolioAccountId, assetId, type: 'capital' },
        { portfolioAccountId, assetId, type: 'income' },
      ])
      .onConflictDoNothing(),
  ]);
  // TODO: Log errors.
  results.forEach((result) => {
    if (result.status === 'rejected') {
      console.error(result.reason);
    }
  });
}

/**
 * Get the balance for the given portfolio account and asset. Create one if it
 * does not exist already. DOES NOT CHECK IF THE ACCOUNT AND ASSET BELONG TO
 * THE SAME USER.
 * @param portfolioAccountId The portfolio account ID.
 * @param assetId The asset ID.
 * @returns The balance object.
 */
export async function getBalanceGuaranteed(
  portfolioAccountId: SelectBalance['portfolioAccountId'],
  assetId: SelectBalance['assetId'],
) {
  const result = await db.transaction(async (tx) => {
    const balance = await tx
      .select()
      .from(balances)
      .where(
        and(
          eq(balances.portfolioAccountId, portfolioAccountId),
          eq(balances.assetId, assetId),
        ),
      )
      .limit(1);
    if (balance.length) {
      return balance[0]!;
    }
    const newBalance = await tx
      .insert(balances)
      .values({ portfolioAccountId, assetId })
      .returning();
    return newBalance[0]!;
  });
  return result;
}

/**
 * Get the ledger for the given portfolio account, asset, and type. Create one
 * if it does not exist already. DOES NOT CHECK IF THE ACCOUNT AND ASSET BELONG
 * TO THE SAME USER.
 * @param portfolioAccountId The portfolio account ID.
 * @param assetId The asset ID.
 * @param type The ledger type.
 * @returns The ledger object.
 */
export async function getLedgerGuaranteed(
  portfolioAccountId: SelectLedger['portfolioAccountId'],
  assetId: SelectLedger['assetId'],
  type: SelectLedger['type'],
) {
  const result = await db.transaction(async (tx) => {
    const ledger = await tx
      .select()
      .from(ledgers)
      .where(
        and(
          eq(ledgers.portfolioAccountId, portfolioAccountId),
          eq(ledgers.assetId, assetId),
          eq(ledgers.type, type),
        ),
      )
      .limit(1);
    if (ledger.length) {
      return ledger[0]!;
    }
    const newLedger = await tx
      .insert(ledgers)
      .values({ portfolioAccountId, assetId, type })
      .returning();
    return newLedger[0]!;
  });
  return result;
}

/**
 * Calculate and set the balance for a given portfolio account and asset. Looks
 * through the asset ledger entries and sums the amounts. DOES NOT CHECK IF THE
 * ACCOUNT AND ASSET BELONG TO THE SAME USER.
 * @param portfolioAccountId The portfolio account ID.
 * @param assetId The asset ID.
 * @returns The balance object.
 */
export async function calculateBalance(
  portfolioAccountId: SelectBalance['portfolioAccountId'],
  assetId: SelectBalance['assetId'],
) {
  const assetSum = db.$with('asset_sum').as(
    db
      .select({
        sum: sql<string>`COALESCE(SUM(${ledgerEntries.amount}), 0)`.as('sum'),
      })
      .from(ledgerEntries)
      .innerJoin(ledgers, eq(ledgerEntries.ledgerId, ledgers.id))
      .where(
        and(
          eq(ledgers.portfolioAccountId, portfolioAccountId),
          eq(ledgers.assetId, assetId),
          eq(ledgers.type, 'asset'),
        ),
      ),
  );
  const result = await db
    .with(assetSum)
    .insert(balances)
    .values({
      portfolioAccountId,
      assetId,
      balance: sql`(select * from ${assetSum})`,
    })
    .onConflictDoUpdate({
      target: [balances.portfolioAccountId, balances.assetId],
      set: { balance: sql`(select * from ${assetSum})`, updatedAt: sql`NOW()` },
    })
    .returning();

  return result[0]!;
}

/**
 * Calculate and set the balances for a given list of portfolio accounts and
 * assets. DOES NOT CHECK IF THE ACCOUNTS AND ASSETS BELONG TO THE SAME USER.
 * @param portfolioAccountIds The portfolio account IDs.
 * @param assetIds The asset IDs.
 * @returns The balance objects.
 * @see {@link calculateBalance}
 */
export async function calculateBalances(
  portfolioAccountIds:
    | SelectBalance['portfolioAccountId']
    | SelectBalance['portfolioAccountId'][],
  assetIds: SelectBalance['assetId'] | SelectBalance['assetId'][],
) {
  if (!Array.isArray(portfolioAccountIds)) {
    portfolioAccountIds = [portfolioAccountIds];
  }
  if (!Array.isArray(assetIds)) {
    assetIds = [assetIds];
  }
  if (!portfolioAccountIds.length || !assetIds.length) {
    return [];
  }
  // Remove duplicate IDs.
  portfolioAccountIds = [...new Set(portfolioAccountIds)];
  assetIds = [...new Set(assetIds)];

  return await Promise.all(
    portfolioAccountIds
      .map((accountId) =>
        assetIds.map((assetId) => calculateBalance(accountId, assetId)),
      )
      .flat(),
  );
}
