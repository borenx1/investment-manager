import { aliasedTable, and, desc, eq, ne, sql } from 'drizzle-orm';

import { db } from './';
import {
  accountTransferTransactions,
  assets,
  balances,
  capitalTransactions,
  InsertAsset,
  InsertPortfolioAccount,
  InsertTransaction,
  ledgerEntries,
  ledgers,
  portfolioAccounts,
  SelectAccountTransferTransaction,
  SelectAsset,
  SelectCapitalTransaction,
  SelectLedgerEntry,
  SelectPortfolioAccount,
  SelectTransaction,
  transactions,
} from './schema';
import {
  calculateBalance,
  createBalanceAndLedgers,
  getLedgerGuaranteed,
} from './unsafeQueries';

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

export async function getBalances(userId: SelectAsset['userId']) {
  return await db
    .select()
    .from(balances)
    .innerJoin(
      portfolioAccounts,
      eq(balances.portfolioAccountId, portfolioAccounts.id),
    )
    .innerJoin(assets, eq(balances.assetId, assets.id))
    .where(and(eq(portfolioAccounts.userId, userId), eq(assets.userId, userId)))
    .orderBy(
      portfolioAccounts.order,
      portfolioAccounts.id,
      assets.ticker,
      assets.id,
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
    portfolioAccount: SelectPortfolioAccount;
    asset: SelectAsset;
  }[];
}

export async function getCapitalTransaction(
  userId: SelectTransaction['userId'],
  id: SelectCapitalTransaction['id'],
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
    .where(and(eq(capitalTransactions.id, id), eq(transactions.userId, userId)))
    .limit(1);
  return result.length
    ? (result[0]! as {
        capitalTransaction: SelectCapitalTransaction;
        transaction: SelectTransaction;
        assetEntry: SelectLedgerEntry;
        capitalEntry: SelectLedgerEntry;
        feeAssetEntry: SelectLedgerEntry | null;
        feeIncomeEntry: SelectLedgerEntry | null;
        portfolioAccount: SelectPortfolioAccount;
        asset: SelectAsset;
      })
    : null;
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
  const [isPortfolioAccountOwned, isAssetOwned] = await Promise.all([
    isPortfolioAccountBelongToUser(userId, portfolioAccountId),
    isAssetBelongToUser(userId, assetId),
  ]);
  if (!isPortfolioAccountOwned) {
    throw new Error('Portfolio account does not belong to the user');
  }
  if (!isAssetOwned) {
    throw new Error('Asset does not belong to the user');
  }

  const [assetLedger, capitalLedger] = await Promise.all([
    getLedgerGuaranteed(portfolioAccountId, assetId, 'asset'),
    getLedgerGuaranteed(portfolioAccountId, assetId, 'capital'),
  ]);
  const result = await db.transaction(async (tx) => {
    const transactionId = await tx
      .insert(transactions)
      .values({
        userId,
        date,
        title: amount >= 0 ? 'Contributions' : 'Drawings',
        description,
      })
      .returning({ id: transactions.id });
    const [assetEntryId, capitalEntryId] = await tx
      .insert(ledgerEntries)
      .values([
        {
          ledgerId: assetLedger.id,
          transactionId: transactionId[0]!.id,
          amount: assetAmountString,
        },
        {
          ledgerId: capitalLedger.id,
          transactionId: transactionId[0]!.id,
          amount: capitalAmountString,
        },
      ])
      .returning({ id: ledgerEntries.id });

    let feeAssetEntryId: number | null = null;
    let feeIncomeEntryId: number | null = null;
    if (assetFeeString && incomeFeeString) {
      const incomeLedger = await getLedgerGuaranteed(
        portfolioAccountId,
        assetId,
        'income',
      );
      const [feeAssetEntryResult, feeIncomeEntryResult] = await tx
        .insert(ledgerEntries)
        .values([
          {
            ledgerId: assetLedger.id,
            transactionId: transactionId[0]!.id,
            amount: assetFeeString,
          },
          {
            ledgerId: incomeLedger.id,
            transactionId: transactionId[0]!.id,
            amount: incomeFeeString,
          },
        ])
        .returning({ id: ledgerEntries.id });
      feeAssetEntryId = feeAssetEntryResult!.id;
      feeIncomeEntryId = feeIncomeEntryResult!.id;
    }

    const capitalTransactionId = await tx
      .insert(capitalTransactions)
      .values({
        transactionId: transactionId[0]!.id,
        assetEntryId: assetEntryId!.id,
        capitalEntryId: capitalEntryId!.id,
        feeAssetEntryId,
        feeIncomeEntryId,
      })
      .returning({ id: capitalTransactions.id });

    return {
      capitalTransactionId: capitalTransactionId[0]!.id,
      transactionId: transactionId[0]!.id,
      assetEntryId: assetEntryId!.id,
      capitalEntryId: capitalEntryId!.id,
      feeAssetEntryId,
      feeIncomeEntryId,
    };
  });

  await calculateBalance(portfolioAccountId, assetId);

  return result;
}

/**
 * Update a capital transaction in the database.
 * @param userId The user ID.
 * @param param1 The capital transaction ID and data to update.
 * @returns The IDs of the updated or inserted rows.
 */
export async function updateCapitalTransaction(
  userId: SelectTransaction['userId'],
  {
    id,
    portfolioAccountId,
    assetId,
    date,
    amount,
    fee,
    description,
  }: {
    id: SelectCapitalTransaction['id'];
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

  const original = await getCapitalTransaction(userId, id);
  if (!original) {
    throw new Error('Capital transaction does not belong to the user');
  }
  // Check that the account and asset belong to the user.
  if (
    portfolioAccountId !== original.portfolioAccount.id ||
    assetId !== original.asset.id
  ) {
    const [isPortfolioAccountOwned, isAssetOwned] = await Promise.all([
      isPortfolioAccountBelongToUser(userId, portfolioAccountId),
      isAssetBelongToUser(userId, assetId),
    ]);
    if (!isPortfolioAccountOwned) {
      throw new Error('Portfolio account does not belong to the user');
    }
    if (!isAssetOwned) {
      throw new Error('Asset does not belong to the user');
    }
  }

  const isSameLedger =
    original.portfolioAccount.id === portfolioAccountId &&
    original.asset.id === assetId;
  const result = await db.transaction(async (tx) => {
    await tx
      .update(transactions)
      .set({
        date,
        title: amount >= 0 ? 'Contributions' : 'Drawings',
        description,
        updatedAt: sql`NOW()`,
      })
      .where(eq(transactions.id, original.transaction.id));

    const assetLedgerId = isSameLedger
      ? original.assetEntry.ledgerId
      : (await getLedgerGuaranteed(portfolioAccountId, assetId, 'asset')).id;
    const capitalLedgerId = isSameLedger
      ? original.capitalEntry.ledgerId
      : (await getLedgerGuaranteed(portfolioAccountId, assetId, 'capital')).id;
    await Promise.all([
      tx
        .update(ledgerEntries)
        .set({
          ledgerId: assetLedgerId,
          amount: assetAmountString,
          updatedAt: sql`NOW()`,
        })
        .where(eq(ledgerEntries.id, original.capitalTransaction.assetEntryId)),
      tx
        .update(ledgerEntries)
        .set({
          ledgerId: capitalLedgerId,
          amount: capitalAmountString,
          updatedAt: sql`NOW()`,
        })
        .where(
          eq(ledgerEntries.id, original.capitalTransaction.capitalEntryId),
        ),
    ]);

    let feeAssetEntryId: number | null =
      original.capitalTransaction.feeAssetEntryId;
    let feeIncomeEntryId: number | null =
      original.capitalTransaction.feeIncomeEntryId;
    if (assetFeeString && incomeFeeString) {
      const incomeLedgerId =
        isSameLedger && original.feeIncomeEntry?.ledgerId
          ? original.feeIncomeEntry.ledgerId
          : (await getLedgerGuaranteed(portfolioAccountId, assetId, 'income'))
              .id;
      if (original.capitalTransaction.feeAssetEntryId) {
        // If fee changes, update the fee entry.
        await tx
          .update(ledgerEntries)
          .set({
            ledgerId: assetLedgerId,
            amount: assetFeeString,
            updatedAt: sql`NOW()`,
          })
          .where(
            eq(ledgerEntries.id, original.capitalTransaction.feeAssetEntryId),
          );
      } else {
        // If fee is added, insert a fee entry.
        const feeAssetEntryResult = await tx
          .insert(ledgerEntries)
          .values({
            ledgerId: assetLedgerId,
            transactionId: original.transaction.id,
            amount: assetFeeString,
          })
          .returning({ id: ledgerEntries.id });
        feeAssetEntryId = feeAssetEntryResult[0]!.id;
      }
      if (original.capitalTransaction.feeIncomeEntryId) {
        // If fee changes, update the fee entry.
        await tx
          .update(ledgerEntries)
          .set({
            ledgerId: incomeLedgerId,
            amount: incomeFeeString,
            updatedAt: sql`NOW()`,
          })
          .where(
            eq(ledgerEntries.id, original.capitalTransaction.feeIncomeEntryId),
          );
      } else {
        // If fee is added, insert a fee entry.
        const feeIncomeEntryResult = await tx
          .insert(ledgerEntries)
          .values({
            ledgerId: incomeLedgerId,
            transactionId: original.transaction.id,
            amount: incomeFeeString,
          })
          .returning({ id: ledgerEntries.id });
        feeIncomeEntryId = feeIncomeEntryResult[0]!.id;
      }
    } else {
      if (original.capitalTransaction.feeAssetEntryId) {
        // If fee is deleted, delete the fee entry.
        await tx
          .delete(ledgerEntries)
          .where(
            eq(ledgerEntries.id, original.capitalTransaction.feeAssetEntryId),
          );
        feeAssetEntryId = null;
      }
      if (original.capitalTransaction.feeIncomeEntryId) {
        // If fee is deleted, delete the fee entry.
        await tx
          .delete(ledgerEntries)
          .where(
            eq(ledgerEntries.id, original.capitalTransaction.feeIncomeEntryId),
          );
        feeIncomeEntryId = null;
      }
    }

    await tx
      .update(capitalTransactions)
      .set({
        feeAssetEntryId,
        feeIncomeEntryId,
        updatedAt: sql`NOW()`,
      })
      .where(eq(capitalTransactions.id, id));

    return {
      capitalTransactionId: id,
      transactionId: original.transaction.id,
      assetEntryId: original.capitalTransaction.assetEntryId,
      capitalEntryId: original.capitalTransaction.capitalEntryId,
      feeAssetEntryId,
      feeIncomeEntryId,
    };
  });

  await calculateBalance(portfolioAccountId, assetId);

  return result;
}

export async function deleteCapitalTransaction(
  userId: SelectTransaction['userId'],
  id: SelectCapitalTransaction['id'],
) {
  const result = await db.transaction(async (tx) => {
    const result = await tx
      .select({ transaction: transactions, ledger: ledgers })
      .from(capitalTransactions)
      .innerJoin(
        transactions,
        eq(capitalTransactions.transactionId, transactions.id),
      )
      .innerJoin(
        ledgerEntries,
        eq(capitalTransactions.assetEntryId, ledgerEntries.id),
      )
      .innerJoin(ledgers, eq(ledgerEntries.ledgerId, ledgers.id))
      .where(
        and(eq(capitalTransactions.id, id), eq(transactions.userId, userId)),
      )
      .limit(1);
    if (!result.length) {
      return;
    }

    const { transaction, ledger } = result[0]!;
    // capital_transaction, ledger_entry will be deleted by cascade.
    await tx
      .delete(transactions)
      .where(
        and(
          eq(transactions.id, transaction.id),
          eq(transactions.userId, userId),
        ),
      );
    return ledger;
  });

  if (result) {
    await calculateBalance(result.portfolioAccountId, result.assetId);
  }
}

export async function getAccountTransferTxs(
  userId: SelectTransaction['userId'],
) {
  const sourcePortfolioAccounts = aliasedTable(
    portfolioAccounts,
    'sourcePortfolioAccount',
  );
  const targetPortfolioAccounts = aliasedTable(
    portfolioAccounts,
    'targetPortfolioAccount',
  );
  const sourceLedgers = aliasedTable(ledgers, 'sourceLedger');
  const targetLedgers = aliasedTable(ledgers, 'targetLedger');
  const sourceAssetEntries = aliasedTable(ledgerEntries, 'sourceAssetEntry');
  const sourceCapitalEntries = aliasedTable(
    ledgerEntries,
    'sourceCapitalEntry',
  );
  const targetAssetEntries = aliasedTable(ledgerEntries, 'targetAssetEntry');
  const targetCapitalEntries = aliasedTable(
    ledgerEntries,
    'targetCapitalEntry',
  );
  const feeAssetEntries = aliasedTable(ledgerEntries, 'feeAssetEntry');
  const feeIncomeEntries = aliasedTable(ledgerEntries, 'feeIncomeEntry');

  // Assume the ledgers all belong to the same asset (different accounts), so
  // only need 2 ledger joins.
  const result = await db
    .select({
      accountTransferTransaction: accountTransferTransactions,
      transaction: transactions,
      sourceAssetEntry: sourceAssetEntries,
      sourceCapitalEntry: sourceCapitalEntries,
      targetAssetEntry: targetAssetEntries,
      targetCapitalEntry: targetCapitalEntries,
      feeAssetEntry: feeAssetEntries,
      feeIncomeEntry: feeIncomeEntries,
      sourcePortfolioAccount: sourcePortfolioAccounts,
      targetPortfolioAccount: targetPortfolioAccounts,
      asset: assets,
    })
    .from(accountTransferTransactions)
    .innerJoin(
      transactions,
      eq(accountTransferTransactions.transactionId, transactions.id),
    )
    .innerJoin(
      sourceAssetEntries,
      eq(accountTransferTransactions.sourceAssetEntryId, sourceAssetEntries.id),
    )
    .innerJoin(
      sourceCapitalEntries,
      eq(
        accountTransferTransactions.sourceCapitalEntryId,
        sourceCapitalEntries.id,
      ),
    )
    .innerJoin(
      targetAssetEntries,
      eq(accountTransferTransactions.targetAssetEntryId, targetAssetEntries.id),
    )
    .innerJoin(
      targetCapitalEntries,
      eq(
        accountTransferTransactions.targetCapitalEntryId,
        targetCapitalEntries.id,
      ),
    )
    .leftJoin(
      feeAssetEntries,
      eq(accountTransferTransactions.feeAssetEntryId, feeAssetEntries.id),
    )
    .leftJoin(
      feeIncomeEntries,
      eq(accountTransferTransactions.feeIncomeEntryId, feeIncomeEntries.id),
    )
    .innerJoin(sourceLedgers, eq(sourceAssetEntries.ledgerId, sourceLedgers.id))
    .innerJoin(targetLedgers, eq(targetAssetEntries.ledgerId, targetLedgers.id))
    .innerJoin(
      sourcePortfolioAccounts,
      eq(sourceLedgers.portfolioAccountId, sourcePortfolioAccounts.id),
    )
    .innerJoin(
      targetPortfolioAccounts,
      eq(targetLedgers.portfolioAccountId, targetPortfolioAccounts.id),
    )
    .innerJoin(assets, eq(sourceLedgers.assetId, assets.id))
    .where(eq(transactions.userId, userId))
    .orderBy(desc(transactions.date), desc(accountTransferTransactions.id));
  return result as {
    accountTransferTransaction: SelectAccountTransferTransaction;
    transaction: SelectTransaction;
    sourceAssetEntry: SelectLedgerEntry;
    sourceCapitalEntry: SelectLedgerEntry;
    targetAssetEntry: SelectLedgerEntry;
    targetCapitalEntry: SelectLedgerEntry;
    feeAssetEntry: SelectLedgerEntry | null;
    feeIncomeEntry: SelectLedgerEntry | null;
    sourcePortfolioAccount: SelectPortfolioAccount;
    targetPortfolioAccount: SelectPortfolioAccount;
    asset: SelectAsset;
  }[];
}

export async function getAccountTransferTx(
  userId: SelectTransaction['userId'],
  id: SelectAccountTransferTransaction['id'],
) {
  const sourcePortfolioAccounts = aliasedTable(
    portfolioAccounts,
    'sourcePortfolioAccount',
  );
  const targetPortfolioAccounts = aliasedTable(
    portfolioAccounts,
    'targetPortfolioAccount',
  );
  const sourceLedgers = aliasedTable(ledgers, 'sourceLedger');
  const targetLedgers = aliasedTable(ledgers, 'targetLedger');
  const sourceAssetEntries = aliasedTable(ledgerEntries, 'sourceAssetEntry');
  const sourceCapitalEntries = aliasedTable(
    ledgerEntries,
    'sourceCapitalEntry',
  );
  const targetAssetEntries = aliasedTable(ledgerEntries, 'targetAssetEntry');
  const targetCapitalEntries = aliasedTable(
    ledgerEntries,
    'targetCapitalEntry',
  );
  const feeAssetEntries = aliasedTable(ledgerEntries, 'feeAssetEntry');
  const feeIncomeEntries = aliasedTable(ledgerEntries, 'feeIncomeEntry');

  // Assume the ledgers all belong to the same asset (different accounts), so
  // only need 2 ledger joins.
  const result = await db
    .select({
      accountTransferTransaction: accountTransferTransactions,
      transaction: transactions,
      sourceAssetEntry: sourceAssetEntries,
      sourceCapitalEntry: sourceCapitalEntries,
      targetAssetEntry: targetAssetEntries,
      targetCapitalEntry: targetCapitalEntries,
      feeAssetEntry: feeAssetEntries,
      feeIncomeEntry: feeIncomeEntries,
      sourcePortfolioAccount: sourcePortfolioAccounts,
      targetPortfolioAccount: targetPortfolioAccounts,
      asset: assets,
    })
    .from(accountTransferTransactions)
    .innerJoin(
      transactions,
      eq(accountTransferTransactions.transactionId, transactions.id),
    )
    .innerJoin(
      sourceAssetEntries,
      eq(accountTransferTransactions.sourceAssetEntryId, sourceAssetEntries.id),
    )
    .innerJoin(
      sourceCapitalEntries,
      eq(
        accountTransferTransactions.sourceCapitalEntryId,
        sourceCapitalEntries.id,
      ),
    )
    .innerJoin(
      targetAssetEntries,
      eq(accountTransferTransactions.targetAssetEntryId, targetAssetEntries.id),
    )
    .innerJoin(
      targetCapitalEntries,
      eq(
        accountTransferTransactions.targetCapitalEntryId,
        targetCapitalEntries.id,
      ),
    )
    .leftJoin(
      feeAssetEntries,
      eq(accountTransferTransactions.feeAssetEntryId, feeAssetEntries.id),
    )
    .leftJoin(
      feeIncomeEntries,
      eq(accountTransferTransactions.feeIncomeEntryId, feeIncomeEntries.id),
    )
    .innerJoin(sourceLedgers, eq(sourceAssetEntries.ledgerId, sourceLedgers.id))
    .innerJoin(targetLedgers, eq(targetAssetEntries.ledgerId, targetLedgers.id))
    .innerJoin(
      sourcePortfolioAccounts,
      eq(sourceLedgers.portfolioAccountId, sourcePortfolioAccounts.id),
    )
    .innerJoin(
      targetPortfolioAccounts,
      eq(targetLedgers.portfolioAccountId, targetPortfolioAccounts.id),
    )
    .innerJoin(assets, eq(sourceLedgers.assetId, assets.id))
    .where(
      and(
        eq(accountTransferTransactions.id, id),
        eq(transactions.userId, userId),
      ),
    )
    .limit(1);
  return result.length
    ? (result[0]! as {
        accountTransferTransaction: SelectAccountTransferTransaction;
        transaction: SelectTransaction;
        sourceAssetEntry: SelectLedgerEntry;
        sourceCapitalEntry: SelectLedgerEntry;
        targetAssetEntry: SelectLedgerEntry;
        targetCapitalEntry: SelectLedgerEntry;
        feeAssetEntry: SelectLedgerEntry | null;
        feeIncomeEntry: SelectLedgerEntry | null;
        sourcePortfolioAccount: SelectPortfolioAccount;
        targetPortfolioAccount: SelectPortfolioAccount;
        asset: SelectAsset;
      })
    : null;
}

/**
 * Create a new account transfer transaction in the database for the user.
 * @param userId The user ID.
 * @param param1 The new transaction data.
 * @returns The IDs of the inserted rows.
 */
export async function createAccountTransferTx(
  userId: SelectTransaction['userId'],
  {
    sourcePortfolioAccountId,
    targetPortfolioAccountId,
    assetId,
    date,
    amount,
    fee,
    description,
  }: {
    sourcePortfolioAccountId: SelectPortfolioAccount['id'];
    targetPortfolioAccountId: SelectPortfolioAccount['id'];
    assetId: SelectAsset['id'];
    date: InsertTransaction['date'];
    amount: number;
    fee: number | null;
    description: InsertTransaction['description'];
  },
) {
  // Assume `amount` is positive.
  const sourceAssetAmountString = String(-amount);
  const sourceCapitalAmountString = String(amount);
  const targetAssetAmountString = sourceCapitalAmountString;
  const targetCapitalAmountString = sourceAssetAmountString;
  // Assume `fee` is positive.
  const sourceAssetFeeString = fee ? String(-fee) : null;
  const sourceIncomeFeeString = fee ? String(fee) : null;
  description = description?.trim() || null;

  // First check that the account and asset belong to the user.
  const [isSourceAccountOwned, isTargetAccountOwned, isAssetOwned] =
    await Promise.all([
      isPortfolioAccountBelongToUser(userId, sourcePortfolioAccountId),
      isPortfolioAccountBelongToUser(userId, targetPortfolioAccountId),
      isAssetBelongToUser(userId, assetId),
    ]);
  if (!isSourceAccountOwned) {
    throw new Error('Source portfolio account does not belong to the user');
  }
  if (!isTargetAccountOwned) {
    throw new Error('Target portfolio account does not belong to the user');
  }
  if (!isAssetOwned) {
    throw new Error('Asset does not belong to the user');
  }

  const [
    sourceAssetLedger,
    sourceCapitalLedger,
    targetAssetLedger,
    targetCapitalLedger,
  ] = await Promise.all([
    getLedgerGuaranteed(sourcePortfolioAccountId, assetId, 'asset'),
    getLedgerGuaranteed(sourcePortfolioAccountId, assetId, 'capital'),
    getLedgerGuaranteed(targetPortfolioAccountId, assetId, 'asset'),
    getLedgerGuaranteed(targetPortfolioAccountId, assetId, 'capital'),
  ]);
  const result = await db.transaction(async (tx) => {
    const transactionId = await tx
      .insert(transactions)
      .values({
        userId,
        date,
        title: 'Account transfer',
        description,
      })
      .returning({ id: transactions.id });
    const [
      sourceAssetEntryId,
      sourceCapitalEntryId,
      targetAssetEntryId,
      targetCapitalEntryId,
    ] = await tx
      .insert(ledgerEntries)
      .values([
        {
          ledgerId: sourceAssetLedger.id,
          transactionId: transactionId[0]!.id,
          amount: sourceAssetAmountString,
        },
        {
          ledgerId: sourceCapitalLedger.id,
          transactionId: transactionId[0]!.id,
          amount: sourceCapitalAmountString,
        },
        {
          ledgerId: targetAssetLedger.id,
          transactionId: transactionId[0]!.id,
          amount: targetAssetAmountString,
        },
        {
          ledgerId: targetCapitalLedger.id,
          transactionId: transactionId[0]!.id,
          amount: targetCapitalAmountString,
        },
      ])
      .returning({ id: ledgerEntries.id });

    let sourceFeeAssetEntryId: number | null = null;
    let sourceFeeIncomeEntryId: number | null = null;
    if (sourceAssetFeeString && sourceIncomeFeeString) {
      const sourceIncomeLedger = await getLedgerGuaranteed(
        sourcePortfolioAccountId,
        assetId,
        'income',
      );
      const [sourceFeeAssetEntryResult, sourceFeeIncomeEntryResult] = await tx
        .insert(ledgerEntries)
        .values([
          {
            ledgerId: sourceAssetLedger.id,
            transactionId: transactionId[0]!.id,
            amount: sourceAssetFeeString,
          },
          {
            ledgerId: sourceIncomeLedger.id,
            transactionId: transactionId[0]!.id,
            amount: sourceIncomeFeeString,
          },
        ])
        .returning({ id: ledgerEntries.id });
      sourceFeeAssetEntryId = sourceFeeAssetEntryResult!.id;
      sourceFeeIncomeEntryId = sourceFeeIncomeEntryResult!.id;
    }

    const accountTransferTxId = await tx
      .insert(accountTransferTransactions)
      .values({
        transactionId: transactionId[0]!.id,
        sourceAssetEntryId: sourceAssetEntryId!.id,
        sourceCapitalEntryId: sourceCapitalEntryId!.id,
        targetAssetEntryId: targetAssetEntryId!.id,
        targetCapitalEntryId: targetCapitalEntryId!.id,
        feeAssetEntryId: sourceFeeAssetEntryId,
        feeIncomeEntryId: sourceFeeIncomeEntryId,
      })
      .returning({ id: accountTransferTransactions.id });

    return {
      accountTransferTransactionId: accountTransferTxId[0]!.id,
      transactionId: transactionId[0]!.id,
      sourceAssetEntryId: sourceAssetEntryId!.id,
      sourceCapitalEntryId: sourceCapitalEntryId!.id,
      targetAssetEntryId: targetAssetEntryId!.id,
      targetCapitalEntryId: targetCapitalEntryId!.id,
      feeAssetEntryId: sourceFeeAssetEntryId,
      feeIncomeEntryId: sourceFeeIncomeEntryId,
    };
  });

  await Promise.all([
    calculateBalance(sourcePortfolioAccountId, assetId),
    calculateBalance(targetPortfolioAccountId, assetId),
  ]);

  return result;
}

/**
 * Update an account transfer transaction in the database.
 * @param userId The user ID.
 * @param param1 The account transfer transaction ID and data to update.
 * @returns The IDs of the updated or inserted rows.
 */
export async function updateAccountTransferTx(
  userId: SelectTransaction['userId'],
  {
    id,
    sourcePortfolioAccountId,
    targetPortfolioAccountId,
    assetId,
    date,
    amount,
    fee,
    description,
  }: {
    id: SelectAccountTransferTransaction['id'];
    sourcePortfolioAccountId: SelectPortfolioAccount['id'];
    targetPortfolioAccountId: SelectPortfolioAccount['id'];
    assetId: SelectAsset['id'];
    date: InsertTransaction['date'];
    amount: number;
    fee: number | null;
    description: InsertTransaction['description'];
  },
) {
  // Assume `amount` is positive.
  const sourceAssetAmountString = String(-amount);
  const sourceCapitalAmountString = String(amount);
  const targetAssetAmountString = sourceCapitalAmountString;
  const targetCapitalAmountString = sourceAssetAmountString;
  // Assume `fee` is positive.
  const sourceAssetFeeString = fee ? String(-fee) : null;
  const sourceIncomeFeeString = fee ? String(fee) : null;
  description = description?.trim() || null;

  const original = await getAccountTransferTx(userId, id);
  if (!original) {
    throw new Error('Account Transfer transaction does not belong to the user');
  }
  // Check that the account and asset belong to the user.
  if (
    sourcePortfolioAccountId !== original.sourcePortfolioAccount.id ||
    targetPortfolioAccountId !== original.targetPortfolioAccount.id ||
    assetId !== original.asset.id
  ) {
    const [isSourceAccountOwned, isTargetAccountOwned, isAssetOwned] =
      await Promise.all([
        isPortfolioAccountBelongToUser(userId, sourcePortfolioAccountId),
        isPortfolioAccountBelongToUser(userId, targetPortfolioAccountId),
        isAssetBelongToUser(userId, assetId),
      ]);
    if (!isSourceAccountOwned) {
      throw new Error('Source portfolio account does not belong to the user');
    }
    if (!isTargetAccountOwned) {
      throw new Error('Target portfolio account does not belong to the user');
    }
    if (!isAssetOwned) {
      throw new Error('Asset does not belong to the user');
    }
  }

  const isSameSourceLedger =
    original.sourcePortfolioAccount.id === sourcePortfolioAccountId &&
    original.asset.id === assetId;
  const isSameTargetLedger =
    original.targetPortfolioAccount.id === targetPortfolioAccountId &&
    original.asset.id === assetId;
  const result = await db.transaction(async (tx) => {
    await tx
      .update(transactions)
      .set({
        date,
        description,
        updatedAt: sql`NOW()`,
      })
      .where(eq(transactions.id, original.transaction.id));

    const sourceAssetLedgerId = isSameSourceLedger
      ? original.sourceAssetEntry.ledgerId
      : (await getLedgerGuaranteed(sourcePortfolioAccountId, assetId, 'asset'))
          .id;
    const sourceCapitalLedgerId = isSameSourceLedger
      ? original.sourceCapitalEntry.ledgerId
      : (
          await getLedgerGuaranteed(
            sourcePortfolioAccountId,
            assetId,
            'capital',
          )
        ).id;
    const targetAssetLedgerId = isSameTargetLedger
      ? original.targetAssetEntry.ledgerId
      : (await getLedgerGuaranteed(targetPortfolioAccountId, assetId, 'asset'))
          .id;
    const targetCapitalLedgerId = isSameTargetLedger
      ? original.targetCapitalEntry.ledgerId
      : (
          await getLedgerGuaranteed(
            targetPortfolioAccountId,
            assetId,
            'capital',
          )
        ).id;
    await Promise.all([
      tx
        .update(ledgerEntries)
        .set({
          ledgerId: sourceAssetLedgerId,
          amount: sourceAssetAmountString,
          updatedAt: sql`NOW()`,
        })
        .where(
          eq(
            ledgerEntries.id,
            original.accountTransferTransaction.sourceAssetEntryId,
          ),
        ),
      tx
        .update(ledgerEntries)
        .set({
          ledgerId: sourceCapitalLedgerId,
          amount: sourceCapitalAmountString,
          updatedAt: sql`NOW()`,
        })
        .where(
          eq(
            ledgerEntries.id,
            original.accountTransferTransaction.sourceCapitalEntryId,
          ),
        ),
      tx
        .update(ledgerEntries)
        .set({
          ledgerId: targetAssetLedgerId,
          amount: targetAssetAmountString,
          updatedAt: sql`NOW()`,
        })
        .where(
          eq(
            ledgerEntries.id,
            original.accountTransferTransaction.targetAssetEntryId,
          ),
        ),
      tx
        .update(ledgerEntries)
        .set({
          ledgerId: targetCapitalLedgerId,
          amount: targetCapitalAmountString,
          updatedAt: sql`NOW()`,
        })
        .where(
          eq(
            ledgerEntries.id,
            original.accountTransferTransaction.targetCapitalEntryId,
          ),
        ),
    ]);

    let feeAssetEntryId: number | null =
      original.accountTransferTransaction.feeAssetEntryId;
    let feeIncomeEntryId: number | null =
      original.accountTransferTransaction.feeIncomeEntryId;
    if (sourceAssetFeeString && sourceIncomeFeeString) {
      const incomeLedgerId =
        isSameSourceLedger && original.feeIncomeEntry?.ledgerId
          ? original.feeIncomeEntry.ledgerId
          : (
              await getLedgerGuaranteed(
                sourcePortfolioAccountId,
                assetId,
                'income',
              )
            ).id;
      if (original.accountTransferTransaction.feeAssetEntryId) {
        // If fee changes, update the fee entry.
        await tx
          .update(ledgerEntries)
          .set({
            ledgerId: sourceAssetLedgerId,
            amount: sourceAssetFeeString,
            updatedAt: sql`NOW()`,
          })
          .where(
            eq(
              ledgerEntries.id,
              original.accountTransferTransaction.feeAssetEntryId,
            ),
          );
      } else {
        // If fee is added, insert a fee entry.
        const feeAssetEntryResult = await tx
          .insert(ledgerEntries)
          .values({
            ledgerId: sourceAssetLedgerId,
            transactionId: original.transaction.id,
            amount: sourceAssetFeeString,
          })
          .returning({ id: ledgerEntries.id });
        feeAssetEntryId = feeAssetEntryResult[0]!.id;
      }
      if (original.accountTransferTransaction.feeIncomeEntryId) {
        // If fee changes, update the fee entry.
        await tx
          .update(ledgerEntries)
          .set({
            ledgerId: incomeLedgerId,
            amount: sourceIncomeFeeString,
            updatedAt: sql`NOW()`,
          })
          .where(
            eq(
              ledgerEntries.id,
              original.accountTransferTransaction.feeIncomeEntryId,
            ),
          );
      } else {
        // If fee is added, insert a fee entry.
        const feeIncomeEntryResult = await tx
          .insert(ledgerEntries)
          .values({
            ledgerId: incomeLedgerId,
            transactionId: original.transaction.id,
            amount: sourceIncomeFeeString,
          })
          .returning({ id: ledgerEntries.id });
        feeIncomeEntryId = feeIncomeEntryResult[0]!.id;
      }
    } else {
      if (original.accountTransferTransaction.feeAssetEntryId) {
        // If fee is deleted, delete the fee entry.
        await tx
          .delete(ledgerEntries)
          .where(
            eq(
              ledgerEntries.id,
              original.accountTransferTransaction.feeAssetEntryId,
            ),
          );
        feeAssetEntryId = null;
      }
      if (original.accountTransferTransaction.feeIncomeEntryId) {
        // If fee is deleted, delete the fee entry.
        await tx
          .delete(ledgerEntries)
          .where(
            eq(
              ledgerEntries.id,
              original.accountTransferTransaction.feeIncomeEntryId,
            ),
          );
        feeIncomeEntryId = null;
      }
    }

    await tx
      .update(accountTransferTransactions)
      .set({
        feeAssetEntryId,
        feeIncomeEntryId,
        updatedAt: sql`NOW()`,
      })
      .where(eq(accountTransferTransactions.id, id));

    return {
      accountTransferTransactionId: id,
      transactionId: original.transaction.id,
      sourceAssetEntryId:
        original.accountTransferTransaction.sourceAssetEntryId,
      sourceCapitalEntryId:
        original.accountTransferTransaction.sourceCapitalEntryId,
      targetAssetEntryId:
        original.accountTransferTransaction.targetAssetEntryId,
      targetCapitalEntryId:
        original.accountTransferTransaction.targetCapitalEntryId,
      feeAssetEntryId,
      feeIncomeEntryId,
    };
  });

  await Promise.all([
    calculateBalance(sourcePortfolioAccountId, assetId),
    calculateBalance(targetPortfolioAccountId, assetId),
  ]);

  return result;
}

export async function deleteAccountTransferTx(
  userId: SelectTransaction['userId'],
  id: SelectAccountTransferTransaction['id'],
) {
  const sourceLedgers = aliasedTable(ledgers, 'sourceLedger');
  const targetLedgers = aliasedTable(ledgers, 'targetLedger');
  const sourceAssetEntries = aliasedTable(ledgerEntries, 'sourceAssetEntry');
  const targetAssetEntries = aliasedTable(ledgerEntries, 'targetAssetEntry');

  const result = await db.transaction(async (tx) => {
    const result = await tx
      .select({
        transaction: transactions,
        sourceLedger: sourceLedgers,
        targetLedger: targetLedgers,
      })
      .from(accountTransferTransactions)
      .innerJoin(
        transactions,
        eq(accountTransferTransactions.transactionId, transactions.id),
      )
      .innerJoin(
        sourceAssetEntries,
        eq(
          accountTransferTransactions.sourceAssetEntryId,
          sourceAssetEntries.id,
        ),
      )
      .innerJoin(
        targetAssetEntries,
        eq(
          accountTransferTransactions.targetAssetEntryId,
          targetAssetEntries.id,
        ),
      )
      .innerJoin(
        sourceLedgers,
        eq(sourceAssetEntries.ledgerId, sourceLedgers.id),
      )
      .innerJoin(
        targetLedgers,
        eq(targetAssetEntries.ledgerId, targetLedgers.id),
      )
      .where(
        and(
          eq(accountTransferTransactions.id, id),
          eq(transactions.userId, userId),
        ),
      )
      .limit(1);
    if (!result.length) {
      return;
    }

    const { transaction, sourceLedger, targetLedger } = result[0]!;
    // account_transfer_transaction, ledger_entry will be deleted by cascade.
    await tx
      .delete(transactions)
      .where(
        and(
          eq(transactions.id, transaction.id),
          eq(transactions.userId, userId),
        ),
      );
    return { sourceLedger, targetLedger };
  });

  if (result) {
    await Promise.all([
      calculateBalance(
        result.sourceLedger.portfolioAccountId,
        result.sourceLedger.assetId,
      ),
      calculateBalance(
        result.targetLedger.portfolioAccountId,
        result.targetLedger.assetId,
      ),
    ]);
  }
}
