'use server';

import { revalidatePath } from 'next/cache';

import { auth } from '@/auth';
import {
  createAsset,
  createPortfolioAccount,
  deleteAsset,
  deletePortfolioAccount,
  updateAsset,
  updatePortfolioAccount,
} from '@/db/queries';

/**
 * Create a new portfolio account for the authenticated user.
 * @param data The new account data.
 * @returns An error message if the account could not be created.
 */
export async function newPortfolioAccount(data: { name: string }) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;

  const error = await createPortfolioAccount(userId, data);
  if (error) {
    return error;
  }
  revalidatePath('/settings');
  return null;
}

/**
 * Update a portfolio account for the authenticated user.
 * @param data The account data to update.
 * @returns An error message if the account could not be updated.
 */
export async function editPortfolioAccount(data: { id: number; name: string }) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;

  const error = await updatePortfolioAccount(userId, data);
  if (error) {
    return error;
  }
  revalidatePath('/settings');
  return null;
}

export async function removePortfolioAccount(id: number) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return;

  await deletePortfolioAccount(userId, id);
  revalidatePath('/settings');
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

  const error = await createAsset(userId, data);
  if (error) {
    return error;
  }
  revalidatePath('/settings');
  return null;
}

/**
 * Update an asset for the authenticated user.
 * @param data The asset data to update.
 * @returns An error message if the asset could not be updated.
 */
export async function editAsset(data: {
  id: number;
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

  const error = await updateAsset(userId, data);
  if (error) {
    return error;
  }
  revalidatePath('/settings');
  return null;
}

export async function removeAsset(id: number) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return;

  await deleteAsset(userId, id);
  revalidatePath('/settings');
}
