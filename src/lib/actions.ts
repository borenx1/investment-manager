'use server';

import { revalidatePath } from 'next/cache';

import { auth } from '@/auth';
import {
  createPortfolioAccount,
  deletePortfolioAccount,
  updatePortfolioAccount,
} from '@/db/queries';

export async function newPortfolioAccount({ name }: { name: string }) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return;

  // TODO: Duplicate names.
  await createPortfolioAccount(userId, { name });
  revalidatePath('/settings');
}

export async function editPortfolioAccount({
  id,
  name,
}: {
  id: number;
  name: string;
}) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return;

  // TODO: Duplicate names.
  await updatePortfolioAccount(userId, { id, name });
  revalidatePath('/settings');
}

export async function removePortfolioAccount(id: number) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return;

  await deletePortfolioAccount(userId, id);
  revalidatePath('/settings');
}
