import { Plus } from 'lucide-react';

import { auth } from '@/auth';
import { getPortfolioAccounts } from '@/db/queries';
import { Button } from '@/components/ui/button';
import { DialogTrigger } from '@/components/ui/dialog';
import AddEditPortfolioAccountDialog from '@/components/AddEditPortfolioAccountDialog';

export default async function PortfolioAccountSection() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;
  const portfolioAccounts = await getPortfolioAccounts(userId);

  return (
    <>
      {portfolioAccounts.length ? (
        <div>List accounts here...</div>
      ) : (
        <div className="italic">No accounts, please create a new account</div>
      )}
      <AddEditPortfolioAccountDialog>
        <DialogTrigger asChild>
          <Button className="mt-4">
            <Plus />
            New account
          </Button>
        </DialogTrigger>
      </AddEditPortfolioAccountDialog>
    </>
  );
}
