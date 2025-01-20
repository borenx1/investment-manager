'use server';

import { revalidatePath } from 'next/cache';

import { auth } from '@/auth';
import { createPortfolioAccount } from '@/db/queries';

export async function newPortfolioAccount({ name }: { name: string }) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return;

  // TODO: Duplicate names.
  await createPortfolioAccount(userId, { name });
  // TODO: Check if account switcher is updated.
  revalidatePath('/settings');
}
