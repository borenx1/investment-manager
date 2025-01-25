import { aliasedTable, and, desc, eq, ne, sql } from 'drizzle-orm';

import { db } from './';
import {
  assets,
  capitalTransactions,
  InsertAsset,
  InsertPortfolioAccount,
  InsertTransaction,
  ledgerEntries,
  ledgers,
  portfolioAccounts,
  SelectAsset,
  SelectCapitalTransaction,
  SelectLedger,
  SelectLedgerEntry,
  SelectPortfolioAccount,
  SelectTransaction,
  transactions,
} from './schema';
import { createBalanceAndLedgers, getLedgerGuaranteed } from './unsafeQueries';

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

/**
 * Check if the portfolio account belongs to the user.
 * @param userId The user ID.
 * @param portfolioAccountId The portfolio account ID.
 * @returns The account belongs to the user.
 */
export async function isPortfolioAccountBelongToUser(
  userId: SelectPortfolioAccount['userId'],
  portfolioAccountId: SelectPortfolioAccount['id'],
) {
  const count = await db.$count(
    portfolioAccounts,
    and(
      eq(portfolioAccounts.id, portfolioAccountId),
      eq(portfolioAccounts.userId, userId),
    ),
  );
  return !!count;
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
 * Check if the asset belongs to the user.
 * @param userId The user ID.
 * @param assetId The asset ID.
 * @returns The assets belongs to the user.
 */
export async function isAssetBelongToUser(
  userId: SelectAsset['userId'],
  assetId: SelectAsset['id'],
) {
  const count = await db.$count(
    assets,
    and(eq(assets.id, assetId), eq(assets.userId, userId)),
  );
  return !!count;
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
  const isPortfolioAccountOwned = await isPortfolioAccountBelongToUser(
    userId,
    portfolioAccountId,
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
  const isAssetOwned = await isAssetBelongToUser(userId, assetId);
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

export async function getCapitalTransactions(
  userId: SelectTransaction['userId'],
) {
  const assetEntries = aliasedTable(ledgerEntries, 'assetEntry');
  const capitalEntries = aliasedTable(ledgerEntries, 'capitalEntry');
  const feeAssetEntries = aliasedTable(ledgerEntries, 'feeAssetEntry');
  const feeIncomeEntries = aliasedTable(ledgerEntries, 'feeIncomeEntry');

  // Assume the ledgers all belong to the same account and asset, so only need
  // one ledger join.
  const result = await db
    .select({
      capitalTransaction: capitalTransactions,
      transaction: transactions,
      assetEntry: assetEntries,
      capitalEntry: capitalEntries,
      feeAssetEntry: feeAssetEntries,
      feeIncomeEntry: feeIncomeEntries,
      ledger: ledgers,
      portfolioAccount: portfolioAccounts,
      asset: assets,
    })
    .from(capitalTransactions)
    .innerJoin(
      transactions,
      eq(capitalTransactions.transactionId, transactions.id),
    )
    .innerJoin(
      assetEntries,
      eq(capitalTransactions.assetEntryId, assetEntries.id),
    )
    .innerJoin(
      capitalEntries,
      eq(capitalTransactions.capitalEntryId, capitalEntries.id),
    )
    .leftJoin(
      feeAssetEntries,
      eq(capitalTransactions.feeAssetEntryId, feeAssetEntries.id),
    )
    .leftJoin(
      feeIncomeEntries,
      eq(capitalTransactions.feeIncomeEntryId, feeIncomeEntries.id),
    )
    .innerJoin(ledgers, eq(assetEntries.ledgerId, ledgers.id))
    .innerJoin(
      portfolioAccounts,
      eq(ledgers.portfolioAccountId, portfolioAccounts.id),
    )
    .innerJoin(assets, eq(ledgers.assetId, assets.id))
    .where(eq(transactions.userId, userId))
    .orderBy(desc(transactions.date), desc(capitalTransactions.id));
  return result as {
    capitalTransaction: SelectCapitalTransaction;
    transaction: SelectTransaction;
    assetEntry: SelectLedgerEntry;
    capitalEntry: SelectLedgerEntry;
    feeAssetEntry: SelectLedgerEntry | null;
    feeIncomeEntry: SelectLedgerEntry | null;
    ledger: SelectLedger;
    portfolioAccount: SelectPortfolioAccount;
    asset: SelectAsset;
  }[];
}

/**
 * Create a new capital transaction in the database for the user.
 * @param userId The user ID.
 * @param param1 The new transaction data.
 * @returns The IDs of the inserted rows.
 */
export async function createCapitalTransaction(
  userId: SelectTransaction['userId'],
  {
    portfolioAccountId,
    assetId,
    date,
    amount,
    fee,
    description,
  }: {
    portfolioAccountId: SelectPortfolioAccount['id'];
    assetId: SelectAsset['id'];
    date: InsertTransaction['date'];
    amount: number;
    fee: number | null;
    description: InsertTransaction['description'];
  },
) {
  const assetAmountString = String(amount);
  const capitalAmountString = String(-amount);
  // Assume `fee` is positive.
  const assetFeeString = fee ? String(-fee) : null;
  const incomeFeeString = fee ? String(fee) : null;
  description = description?.trim() || null;

  // First check that the account and asset belong to the user.
  const isPortfolioAccountOwned = await isPortfolioAccountBelongToUser(
    userId,
    portfolioAccountId,
  );
  if (!isPortfolioAccountOwned) {
    throw new Error('Portfolio account does not belong to the user');
  }
  const isAssetOwned = await isAssetBelongToUser(userId, assetId);
  if (!isAssetOwned) {
    throw new Error('Asset does not belong to the user');
  }

  const assetLedger = await getLedgerGuaranteed(
    portfolioAccountId,
    assetId,
    'asset',
  );
  const capitalLedger = await getLedgerGuaranteed(
    portfolioAccountId,
    assetId,
    'capital',
  );
  const result = await db.transaction(async (tx) => {
    const transactionId = await tx
      .insert(transactions)
      .values({
        userId,
        date,
        title: amount >= 0 ? 'Capital contributions' : 'Drawings',
        description,
      })
      .returning({ id: transactions.id });
    const assetEntryId = await tx
      .insert(ledgerEntries)
      .values({
        ledgerId: assetLedger.id,
        transactionId: transactionId[0]!.id,
        amount: assetAmountString,
      })
      .returning({ id: ledgerEntries.id });
    const capitalEntryId = await tx
      .insert(ledgerEntries)
      .values({
        ledgerId: capitalLedger.id,
        transactionId: transactionId[0]!.id,
        amount: capitalAmountString,
      })
      .returning({ id: ledgerEntries.id });

    let feeAssetEntryId: number | null = null;
    let feeIncomeEntryId: number | null = null;
    if (assetFeeString && incomeFeeString) {
      const incomeLedger = await getLedgerGuaranteed(
        portfolioAccountId,
        assetId,
        'income',
      );
      const feeAssetEntryResult = await tx
        .insert(ledgerEntries)
        .values({
          ledgerId: assetLedger.id,
          transactionId: transactionId[0]!.id,
          amount: assetFeeString,
        })
        .returning({ id: ledgerEntries.id });
      feeAssetEntryId = feeAssetEntryResult[0]!.id;
      const feeIncomeEntryResult = await tx
        .insert(ledgerEntries)
        .values({
          ledgerId: incomeLedger.id,
          transactionId: transactionId[0]!.id,
          amount: incomeFeeString,
        })
        .returning({ id: ledgerEntries.id });
      feeIncomeEntryId = feeIncomeEntryResult[0]!.id;
    }

    await tx.insert(capitalTransactions).values({
      transactionId: transactionId[0]!.id,
      assetEntryId: assetEntryId[0]!.id,
      capitalEntryId: capitalEntryId[0]!.id,
      feeAssetEntryId: feeAssetEntryId,
      feeIncomeEntryId: feeIncomeEntryId,
    });

    return {
      transactionId: transactionId[0]!.id,
      assetEntryId: assetEntryId[0]!.id,
      capitalEntryId: capitalEntryId[0]!.id,
      feeAssetEntryId,
      feeIncomeEntryId,
    };
  });
  return result;
}

export async function deleteCapitalTransaction(
  userId: SelectTransaction['userId'],
  id: SelectCapitalTransaction['id'],
) {
  await db.transaction(async (tx) => {
    const result = await tx
      .select()
      .from(capitalTransactions)
      .innerJoin(
        transactions,
        eq(capitalTransactions.transactionId, transactions.id),
      )
      .where(
        and(eq(capitalTransactions.id, id), eq(transactions.userId, userId)),
      )
      .limit(1);
    if (!result.length) {
      return;
    }

    const { transaction } = result[0]!;
    // capital_transaction, ledger_entry will be deleted by cascade.
    await tx
      .delete(transactions)
      .where(
        and(
          eq(transactions.id, transaction.id),
          eq(transactions.userId, userId),
        ),
      );
  });
}
