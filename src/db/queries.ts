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

export async function getPortfolioAccounts(
  userId: SelectPortfolioAccount['userId'],
) {
  return await db
    .select()
    .from(portfolioAccounts)
    .where(eq(portfolioAccounts.userId, userId))
    .orderBy(portfolioAccounts.order, portfolioAccounts.id);
}

export async function createPortfolioAccount(
  userId: SelectPortfolioAccount['userId'],
  { name }: { name: InsertPortfolioAccount['name'] },
) {
  const currentAccounts = await getPortfolioAccounts(userId);
  const order = currentAccounts.length
    ? currentAccounts[currentAccounts.length - 1]!.order + 1
    : 0;
  await db.insert(portfolioAccounts).values({
    userId,
    name: name.trim(),
    order,
  });
}

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
  await db
    .update(portfolioAccounts)
    .set({ name: name?.trim(), order, updatedAt: sql`NOW()` })
    .where(
      and(eq(portfolioAccounts.id, id), eq(portfolioAccounts.userId, userId)),
    );
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
 * @returns An error message if the asset could not be created.
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

  await db.insert(assets).values({
    userId,
    ticker,
    name,
    symbol,
    precision,
    pricePrecision,
    isCurrency,
  });
  return null;
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
