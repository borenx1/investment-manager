'use client';

import { EllipsisVertical, Pencil, Plus, Trash2 } from 'lucide-react';

import { removePortfolioAccount } from '@/lib/actions';
import { useResourceStore } from '@/providers/resource-store-provider';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
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

export default function PortfolioAccountSection() {
  const portfolioAccounts = useResourceStore(
    (state) => state.portfolioAccounts,
  );
  const isPortfolioAccountsLoaded = useResourceStore(
    (state) => state.isPortfolioAccountsLoaded,
  );

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
                    <AddEditPortfolioAccountDialog account={account}>
                      <AlertDialog>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost">
                              <span className="sr-only">Open menu</span>
                              <EllipsisVertical />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DialogTrigger asChild>
                              <DropdownMenuItem>
                                <Pencil />
                                Edit
                              </DropdownMenuItem>
                            </DialogTrigger>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem>
                                <Trash2 />
                                Delete
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Account</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this portfolio
                              account?
                              <br />
                              {account.name}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Back</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={async () => {
                                await removePortfolioAccount(account.id);
                              }}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </AddEditPortfolioAccountDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="italic">
          {isPortfolioAccountsLoaded
            ? 'No accounts, please create a new account'
            : 'Loading...'}
        </div>
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
