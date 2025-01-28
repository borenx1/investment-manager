import { Suspense } from 'react';

import { auth } from '@/auth';
import { getBalances } from '@/db/queries';
import BalanceTable, { BalanceTableSkeleton } from './BalanceTable';

export default async function BalanceSection() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;
  const balances = getBalances(userId);

  return (
    <div>
      <Suspense fallback={<BalanceTableSkeleton />}>
        <BalanceTable balances={balances} />
      </Suspense>
    </div>
  );
}
