import { Suspense } from 'react';
import type { Metadata } from 'next';
import { Plus } from 'lucide-react';

import { auth } from '@/auth';
import { getCapitalTransactions } from '@/db/queries';
import { Button } from '@/components/ui/button';
import { DialogTrigger } from '@/components/ui/dialog';
import AddEditCapitalTransactionDialog from '@/components/AddEditCapitalTransactionDIalog';
import CapitalDataTable, { CapitalDataTableSkeleton } from './CapitalDataTable';

export const metadata: Metadata = {
  title: 'Capital Changes',
};

export default async function CapitalPage() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;
  const transactions = getCapitalTransactions(userId);

  return (
    <div className="p-4 sm:p-8">
      <h1 className="mb-8 font-bold">Capital Changes</h1>
      <AddEditCapitalTransactionDialog>
        <DialogTrigger asChild>
          <Button className="mb-8">
            <Plus />
            Add transaction
          </Button>
        </DialogTrigger>
      </AddEditCapitalTransactionDialog>

      <Suspense fallback={<CapitalDataTableSkeleton />}>
        <CapitalDataTable data={transactions} />
      </Suspense>
    </div>
  );
}
