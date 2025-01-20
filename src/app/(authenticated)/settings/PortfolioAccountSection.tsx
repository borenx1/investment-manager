import { EllipsisVertical, Pencil, Plus, Trash2 } from 'lucide-react';

import { auth } from '@/auth';
import { getPortfolioAccounts } from '@/db/queries';
import { Button } from '@/components/ui/button';
import { DialogTrigger } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import AddEditPortfolioAccountDialog from '@/components/AddEditPortfolioAccountDialog';

export default async function PortfolioAccountSection() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;
  const portfolioAccounts = await getPortfolioAccounts(userId);

  return (
    <>
      {portfolioAccounts.length ? (
        <div className="max-w-xl rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-full pl-4">Account name</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {portfolioAccounts.map((account) => (
                <TableRow key={account.id}>
                  <TableCell className="pl-4">{account.name}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost">
                          <EllipsisVertical />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Pencil />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Trash2 />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
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
