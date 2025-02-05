import { Suspense } from 'react';
import { Plus } from 'lucide-react';

import { auth } from '@/auth';
import { getTradeTransactions } from '@/db/queries';
import { Button } from '@/components/ui/button';
import { DialogTrigger } from '@/components/ui/dialog';
import AddEditTradeTransactionDialog from '@/components/AddEditTradeTransactionDialog';
import TradeTable, { TradeTableSkeleton } from './TradeTable';

export default async function TradeTab() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;
  const transactions = getTradeTransactions(userId);

  return (
    <>
      <AddEditTradeTransactionDialog>
        <DialogTrigger asChild>
          <Button className="mb-8">
            <Plus />
            Add transaction
          </Button>
        </DialogTrigger>
      </AddEditTradeTransactionDialog>

      <Suspense fallback={<TradeTableSkeleton />}>
        <TradeTable data={transactions} />
      </Suspense>
    </>
  );
}
