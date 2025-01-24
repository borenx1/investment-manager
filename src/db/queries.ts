import { and, eq, ne, sql } from 'drizzle-orm';

import { db } from './';
import {
  assets,
  InsertAsset,
  InsertPortfolioAccount,
  portfolioAccounts,
  SelectAsset,
  SelectPortfolioAccount,
} from './schema';
import { createBalanceAndLedgers } from './unsafeQueries';

export async function getPortfolioAccounts(
  userId: SelectPortfolioAccount['userId'],
) {
  return await db
    .select()
    .from(portfolioAccounts)
    .where(eq(portfolioAccounts.userId, userId))
    .orderBy(portfolioAccounts.order, portfolioAccounts.id);
}

/**
 * Create a new portfolio account in the database for the user.
 * @param userId The user ID.
 * @param param1 The new portfolio account data.
 * @returns The ID of the inserted account, or an error message if the account
 * could not be created.
 */
export async function createPortfolioAccount(
  userId: SelectPortfolioAccount['userId'],
  { name }: { name: InsertPortfolioAccount['name'] },
) {
  // Check for duplicate values.
  const duplicateName = await db.$count(
    portfolioAccounts,
    and(
      eq(portfolioAccounts.userId, userId),
      eq(portfolioAccounts.name, name.trim()),
    ),
  );
  if (duplicateName) {
    return { message: 'Duplicate name' } as const;
  }

  const currentAccounts = await getPortfolioAccounts(userId);
  const order = currentAccounts.length
    ? currentAccounts[currentAccounts.length - 1]!.order + 1
    : 0;
  const result = await db
    .insert(portfolioAccounts)
    .values({
      userId,
      name: name.trim(),
      order,
    })
    .returning({ id: portfolioAccounts.id });
  return result[0]!.id;
}

/**
 * Update a portfolio account in the database.
 * @param userId The user ID.
 * @param param1 The account ID and data to update.
 * @returns An error message if the account could not be updated.
 */
export async function updatePortfolioAccount(
  userId: SelectPortfolioAccount['userId'],
  {
    id,
    name,
    order,
  }: {
    id: SelectPortfolioAccount['id'];
    name?: InsertPortfolioAccount['name'];
    order?: InsertPortfolioAccount['order'];
  },
) {
  // Check for duplicate values.
  if (name !== undefined) {
    const duplicateName = await db.$count(
      portfolioAccounts,
      and(
        ne(portfolioAccounts.id, id),
        eq(portfolioAccounts.userId, userId),
        eq(portfolioAccounts.name, name.trim()),
      ),
    );
    if (duplicateName) {
      return { message: 'Duplicate name' } as const;
    }
  }

  await db
    .update(portfolioAccounts)
    .set({ name: name?.trim(), order, updatedAt: sql`NOW()` })
    .where(
      and(eq(portfolioAccounts.id, id), eq(portfolioAccounts.userId, userId)),
    );
  return null;
}

export async function deletePortfolioAccount(
  userId: SelectPortfolioAccount['userId'],
  id: SelectPortfolioAccount['id'],
) {
  await db
    .delete(portfolioAccounts)
    .where(
      and(eq(portfolioAccounts.id, id), eq(portfolioAccounts.userId, userId)),
    );
}

export async function getAssets(userId: SelectAsset['userId']) {
  return await db
    .select()
    .from(assets)
    .where(eq(assets.userId, userId))
    .orderBy(assets.ticker, assets.id);
}

/**
 * Create a new asset in the database for the user.
 * @param userId The user ID.
 * @param param1 The new asset data.
 * @returns The ID of the inserted asset, or an error message if the asset
 * could not be created.
 */
export async function createAsset(
  userId: SelectAsset['userId'],
  {
    ticker,
    name,
    symbol,
    precision,
    pricePrecision,
    isCurrency,
  }: {
    ticker: InsertAsset['ticker'];
    name: InsertAsset['name'];
    symbol: InsertAsset['symbol'];
    precision: InsertAsset['precision'];
    pricePrecision: InsertAsset['pricePrecision'];
    isCurrency: InsertAsset['isCurrency'];
  },
) {
  ticker = ticker.trim();
  name = name.trim();
  symbol = symbol?.trim() || null;

  // Check for duplicate values.
  const duplicateTicker = await db.$count(
    assets,
    and(eq(assets.userId, userId), eq(assets.ticker, ticker)),
  );
  if (duplicateTicker) {
    return { message: 'Duplicate ticker' } as const;
  }
  const duplicateName = await db.$count(
    assets,
    and(eq(assets.userId, userId), eq(assets.name, name)),
  );
  if (duplicateName) {
    return { message: 'Duplicate name' } as const;
  }
  if (symbol !== null) {
    const duplicateSymbol = await db.$count(
      assets,
      and(eq(assets.userId, userId), eq(assets.symbol, symbol)),
    );
    if (duplicateSymbol) {
      return { message: 'Duplicate symbol' } as const;
    }
  }

  const result = await db
    .insert(assets)
    .values({
      userId,
      ticker,
      name,
      symbol,
      precision,
      pricePrecision,
      isCurrency,
    })
    .returning({ id: assets.id });
  return result[0]!.id;
}

/**
 * Update an asset in the database.
 * @param userId The user ID.
 * @param param1 The asset ID and data to update.
 * @returns An error message if the asset could not be updated.
 */
export async function updateAsset(
  userId: SelectAsset['userId'],
  {
    id,
    ticker,
    name,
    symbol,
    precision,
    pricePrecision,
    isCurrency,
  }: {
    id: SelectAsset['id'];
    ticker?: InsertAsset['ticker'];
    name?: InsertAsset['name'];
    symbol?: InsertAsset['symbol'];
    precision?: InsertAsset['precision'];
    pricePrecision?: InsertAsset['pricePrecision'];
    isCurrency?: InsertAsset['isCurrency'];
  },
) {
  ticker = ticker?.trim();
  name = name?.trim();
  symbol = symbol !== undefined ? symbol?.trim() || null : undefined;

  // Check for duplicate values.
  if (ticker !== undefined) {
    const duplicateTicker = await db.$count(
      assets,
      and(
        ne(assets.id, id),
        eq(assets.userId, userId),
        eq(assets.ticker, ticker),
      ),
    );
    if (duplicateTicker) {
      return { message: 'Duplicate ticker' } as const;
    }
  }
  if (name !== undefined) {
    const duplicateName = await db.$count(
      assets,
      and(ne(assets.id, id), eq(assets.userId, userId), eq(assets.name, name)),
    );
    if (duplicateName) {
      return { message: 'Duplicate name' } as const;
    }
  }
  if (symbol !== undefined && symbol !== null) {
    const duplicateSymbol = await db.$count(
      assets,
      and(
        ne(assets.id, id),
        eq(assets.userId, userId),
        eq(assets.symbol, symbol),
      ),
    );
    if (duplicateSymbol) {
      return { message: 'Duplicate symbol' } as const;
    }
  }

  await db
    .update(assets)
    .set({
      ticker,
      name,
      symbol,
      precision,
      pricePrecision,
      isCurrency,
      updatedAt: sql`NOW()`,
    })
    .where(and(eq(assets.id, id), eq(assets.userId, userId)));
  return null;
}

export async function deleteAsset(
  userId: SelectAsset['userId'],
  id: SelectAsset['id'],
) {
  await db
    .delete(assets)
    .where(and(eq(assets.id, id), eq(assets.userId, userId)));
}

/**
 * Create the initial balance and ledger databases for the given portfolio
 * account and all the user's assets if they do not exist already.
 * @param userId The user ID.
 * @param portfolioAccountId The portfolio account ID.
 */
export async function initBalanceAndLedgersWithAccount(
  userId: SelectPortfolioAccount['userId'],
  portfolioAccountId: SelectPortfolioAccount['id'],
) {
  // First check that the account belongs to the user.
  const isPortfolioAccountOwned = await db.$count(
    portfolioAccounts,
    and(
      eq(portfolioAccounts.id, portfolioAccountId),
      eq(portfolioAccounts.userId, userId),
    ),
  );
  if (!isPortfolioAccountOwned) {
    throw new Error('Portfolio account does not belong to the user');
  }

  // Get all the user's assets.
  const assetIds = await db
    .select({ id: assets.id })
    .from(assets)
    .where(eq(assets.userId, userId));

  // Initiate the balance and ledgers.
  await Promise.allSettled(
    assetIds.map(({ id: assetId }) =>
      createBalanceAndLedgers(portfolioAccountId, assetId),
    ),
  );
}

export async function initBalanceAndLedgersWithAsset(
  userId: SelectAsset['userId'],
  assetId: SelectAsset['id'],
) {
  // First check that the asset belongs to the user.
  const isAssetOwned = await db.$count(
    assets,
    and(eq(assets.id, assetId), eq(assets.userId, userId)),
  );
  if (!isAssetOwned) {
    throw new Error('Asset does not belong to the user');
  }

  // Get all the user's portfolio accounts.
  const portfolioAccountIds = await db
    .select({ id: portfolioAccounts.id })
    .from(portfolioAccounts)
    .where(eq(portfolioAccounts.userId, userId));

  // Initiate the balance and ledgers.
  await Promise.allSettled(
    portfolioAccountIds.map(({ id: portfolioAccountId }) =>
      createBalanceAndLedgers(portfolioAccountId, assetId),
    ),
  );
}
