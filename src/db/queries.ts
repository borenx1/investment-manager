import { eq } from 'drizzle-orm';

import { db } from './';
import {
  InsertPortfolioAccount,
  portfolioAccounts,
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
