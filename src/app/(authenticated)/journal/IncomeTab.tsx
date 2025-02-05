import { Suspense } from 'react';
import { Plus } from 'lucide-react';

import { auth } from '@/auth';
import { getIncomeTransactions } from '@/db/queries';
import { Button } from '@/components/ui/button';
import { DialogTrigger } from '@/components/ui/dialog';
import AddEditIncomeTransactionDialog from '@/components/AddEditIncomeTransactionDialog';
import IncomeTable, { IncomeTableSkeleton } from './IncomeTable';

export default async function IncomeTab() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;
  const transactions = getIncomeTransactions(userId, 'income');

  return (
    <>
      <AddEditIncomeTransactionDialog>
        <DialogTrigger asChild>
          <Button className="mb-8">
            <Plus />
            Add transaction
          </Button>
        </DialogTrigger>
      </AddEditIncomeTransactionDialog>

      <Suspense fallback={<IncomeTableSkeleton />}>
        <IncomeTable data={transactions} />
      </Suspense>
    </>
  );
}
