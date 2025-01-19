'use server';

import { auth } from '@/auth';

export async function createPortfolioAccount({ name }: { name: string }) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return;

  // TODO
  console.log('Creating portfolio account', name);
  await new Promise((resolve) => setTimeout(resolve, 2000));
}
