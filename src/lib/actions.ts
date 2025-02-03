'use server';

import { revalidatePath } from 'next/cache';

import { auth } from '@/auth';
import {
  createAccountTransferTx,
  createAsset,
  createCapitalTransaction,
  createPortfolioAccount,
  deleteAccountTransferTx,
  deleteAsset,
  deleteCapitalTransaction,
  deletePortfolioAccount,
  initBalanceAndLedgersWithAccount,
  initBalanceAndLedgersWithAsset,
  updateAccountTransferTx,
  updateAsset,
  updateCapitalTransaction,
  updatePortfolioAccount,
} from '@/db/queries';
import {
  accountTransferTxForm,
  assetForm,
  capitalTransactionForm,
  portfolioAccountForm,
} from '@/lib/forms';

/**
 * Create a new portfolio account for the authenticated user.
 * @param data The new account data.
 * @returns An error message if the account could not be created.
 */
export async function newPortfolioAccount(data: { name: string }) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;

  const validatedData = portfolioAccountForm.serverSchema.parse(data);
  const idOrError = await createPortfolioAccount(userId, validatedData);
  if (typeof idOrError === 'object') {
    return idOrError;
  }
  await initBalanceAndLedgersWithAccount(userId, idOrError);
  revalidatePath('/', 'layout');
  return null;
}

/**
 * Update a portfolio account for the authenticated user.
 * @param id The ID of the portfolio account to update.
 * @param data The account data to update.
 * @returns An error message if the account could not be updated.
 */
export async function editPortfolioAccount(id: number, data: { name: string }) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;

  const validatedData = portfolioAccountForm.serverSchema.parse(data);
  const error = await updatePortfolioAccount(userId, { id, ...validatedData });
  if (error) {
    return error;
  }
  revalidatePath('/', 'layout');
  return null;
}

export async function removePortfolioAccount(id: number) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return;

  await deletePortfolioAccount(userId, id);
  revalidatePath('/', 'layout');
}

/**
 * Create a new asset for the authenticated user.
 * @param data The new asset data.
 * @returns An error message if the asset could not be created.
 */
export async function newAsset(data: {
  ticker: string;
  name: string;
  symbol: string | null;
  precision: number;
  pricePrecision: number;
  isCurrency: boolean;
}) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;

  const validatedData = assetForm.serverSchema.parse(data);
  const idOrError = await createAsset(userId, validatedData);
  if (typeof idOrError === 'object') {
    return idOrError;
  }
  await initBalanceAndLedgersWithAsset(userId, idOrError);
  revalidatePath('/', 'layout');
  return null;
}

/**
 * Update an asset for the authenticated user.
 * @param id The ID of the asset to update.
 * @param data The asset data to update.
 * @returns An error message if the asset could not be updated.
 */
export async function editAsset(
  id: number,
  data: {
    ticker: string;
    name: string;
    symbol: string | null;
    precision: number;
    pricePrecision: number;
    isCurrency: boolean;
  },
) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;

  const validatedData = assetForm.serverSchema.parse(data);
  const error = await updateAsset(userId, { id, ...validatedData });
  if (error) {
    return error;
  }
  revalidatePath('/', 'layout');
  return null;
}

export async function removeAsset(id: number) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return;

  await deleteAsset(userId, id);
  revalidatePath('/', 'layout');
}

/**
 * Create a new capital transaction for the authenticated user.
 * @param data The new capital transaction data.
 * @returns The IDs of the created rows.
 */
export async function newCapitalTransaction(data: {
  portfolioAccountId: number;
  assetId: number;
  date: Date;
  amount: number;
  fee: number | null;
  description: string | null;
}) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;

  const validatedData = capitalTransactionForm.serverSchema.parse(data);
  const ids = await createCapitalTransaction(userId, validatedData);
  revalidatePath('/capital');
  return ids;
}

/**
 * Update a capital transaction for the authenticated user.
 * @param id The ID of the capital transaction to update.
 * @param data The capital transaction data to update.
 * @returns The IDs of the updated or created rows.
 */
export async function editCapitalTransaction(
  id: number,
  data: {
    portfolioAccountId: number;
    assetId: number;
    date: Date;
    amount: number;
    fee: number | null;
    description: string | null;
  },
) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;

  const validatedData = capitalTransactionForm.serverSchema.parse(data);
  const ids = await updateCapitalTransaction(userId, { id, ...validatedData });
  revalidatePath('/capital');
  return ids;
}

export async function removeCapitalTransaction(id: number) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return;

  await deleteCapitalTransaction(userId, id);
  revalidatePath('/capital');
}

/**
 * Create a new account transfer transaction for the authenticated user.
 * @param data The new account transfer transaction data.
 * @returns The IDs of the created rows.
 */
export async function newAccountTransferTx(data: {
  sourcePortfolioAccountId: number;
  targetPortfolioAccountId: number;
  assetId: number;
  date: Date;
  amount: number;
  fee: number | null;
  description: string | null;
}) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;

  const validatedData = accountTransferTxForm.serverSchema.parse(data);
  const ids = await createAccountTransferTx(userId, validatedData);
  revalidatePath('/transfers');
  return ids;
}

/**
 * Update a account transfer transaction for the authenticated user.
 * @param id The ID of the account transfer transaction to update.
 * @param data The account transfer transaction data to update.
 * @returns The IDs of the updated or created rows.
 */
export async function editAccountTransferTx(
  id: number,
  data: {
    sourcePortfolioAccountId: number;
    targetPortfolioAccountId: number;
    assetId: number;
    date: Date;
    amount: number;
    fee: number | null;
    description: string | null;
  },
) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;

  const validatedData = accountTransferTxForm.serverSchema.parse(data);
  const ids = await updateAccountTransferTx(userId, { id, ...validatedData });
  revalidatePath('/transfers');
  return ids;
}

export async function removeAccountTransferTx(id: number) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return;

  await deleteAccountTransferTx(userId, id);
  revalidatePath('/transfers');
}
