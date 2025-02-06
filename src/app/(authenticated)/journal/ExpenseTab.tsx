import { Suspense } from 'react';
import { Plus } from 'lucide-react';

import { auth } from '@/auth';
import { getIncomeTransactions } from '@/db/queries';
import { Button } from '@/components/ui/button';
import { DialogTrigger } from '@/components/ui/dialog';
import AddEditExpenseTransactionDialog from '@/components/AddEditExpenseTransactionDialog';
import ExpenseTable, { ExpenseTableSkeleton } from './ExpenseTable';

export default async function ExpenseTab() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;
  const transactions = getIncomeTransactions(userId, 'expense');

  return (
    <>
      <AddEditExpenseTransactionDialog>
        <DialogTrigger asChild>
          <Button className="mb-8">
            <Plus />
            Add transaction
          </Button>
        </DialogTrigger>
      </AddEditExpenseTransactionDialog>

      <Suspense fallback={<ExpenseTableSkeleton />}>
        <ExpenseTable data={transactions} />
      </Suspense>
    </>
  );
}
