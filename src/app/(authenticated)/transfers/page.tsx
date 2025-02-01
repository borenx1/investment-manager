import { Suspense } from 'react';
import type { Metadata } from 'next';
import { Plus } from 'lucide-react';

import { auth } from '@/auth';
import { getAccountTransferTxs } from '@/db/queries';
import { Button } from '@/components/ui/button';
import { DialogTrigger } from '@/components/ui/dialog';
import AddEditAccountTransferTxDialog from '@/components/AddEditAccountTransferTxDialog';
import AccountTransferTable, {
  AccountTransferTableSkeleton,
} from './AccountTransferTable';

export const metadata: Metadata = {
  title: 'Account Transfers',
};

export default async function TransfersPage() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;
  const transactions = getAccountTransferTxs(userId);

  return (
    <div className="p-4 sm:p-8">
      <h1 className="mb-8 font-bold">Account Transfers</h1>
      <AddEditAccountTransferTxDialog>
        <DialogTrigger asChild>
          <Button className="mb-8">
            <Plus />
            Add transaction
          </Button>
        </DialogTrigger>
      </AddEditAccountTransferTxDialog>

      <Suspense fallback={<AccountTransferTableSkeleton />}>
        <AccountTransferTable data={transactions} />
      </Suspense>
    </div>
  );
}
