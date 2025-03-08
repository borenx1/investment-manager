'use client';

import { startTransition, useActionState, useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, LoaderCircle } from 'lucide-react';

import { reorderPortfolioAccounts } from '@/lib/actions';
import { useResourceStore } from '@/providers/resource-store-provider';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';

export default function OrderPortfolioAccountDialog({
  children,
  onOpenChange,
  ...props
}: React.ComponentProps<typeof Dialog>) {
  const [isOpen, setIsOpen] = useState(false);
  // Portfolio accounts from the resource store are already ordered.
  const portfolioAccounts = useResourceStore((state) => state.portfolioAccounts);
  const isPortfolioAccountsLoaded = useResourceStore((state) => state.isPortfolioAccountsLoaded);
  const [accountOrder, setAccountOrder] = useState([...portfolioAccounts]);
  const isOrderChanged = useMemo(() => {
    if (accountOrder.length !== portfolioAccounts.length) return true;
    return accountOrder.some((account, index) => account.id !== portfolioAccounts[index]?.id);
  }, [accountOrder, portfolioAccounts]);

  const moveOrderUp = useCallback(
    (index: number) => {
      index = Math.min(index, accountOrder.length - 1);
      if (index <= 0) return;
      const newOrder = [...accountOrder];
      const temp = newOrder[index]!;
      newOrder[index] = newOrder[index - 1]!;
      newOrder[index - 1] = temp;
      setAccountOrder(newOrder);
    },
    [accountOrder],
  );
  const moveOrderDown = useCallback(
    (index: number) => {
      index = Math.min(index, accountOrder.length - 1);
      if (index >= accountOrder.length - 1) return;
      const newOrder = [...accountOrder];
      const temp = newOrder[index]!;
      newOrder[index] = newOrder[index + 1]!;
      newOrder[index + 1] = temp;
      setAccountOrder(newOrder);
    },
    [accountOrder],
  );

  const [, onSubmit, isPending] = useActionState(async () => {
    await reorderPortfolioAccounts(accountOrder.map((account) => account.id));
    setIsOpen(false);
    onOpenChange?.(false);
    return null;
  }, null);

  useEffect(() => {
    if (props.open !== undefined ? props.open : isOpen) {
      setAccountOrder([...portfolioAccounts]);
    }
  }, [props.open, isOpen, portfolioAccounts]);

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        onOpenChange?.(open);
      }}
      {...props}
    >
      {children}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Account Order</DialogTitle>
          <DialogDescription className="hidden" hidden />
        </DialogHeader>
        <Table className="text-base">
          <TableBody>
            {accountOrder.map((account, index, array) => (
              <TableRow key={account.id}>
                <TableCell>
                  <Button variant="ghost" disabled={index <= 0} onClick={() => moveOrderUp(index)}>
                    <ArrowUp />
                  </Button>
                </TableCell>
                <TableCell className="w-full">{account.name}</TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    disabled={index >= array.length - 1}
                    onClick={() => moveOrderDown(index)}
                  >
                    <ArrowDown />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <DialogFooter>
          <Button
            disabled={!isOrderChanged || isPending || !isPortfolioAccountsLoaded}
            onClick={() => startTransition(() => onSubmit())}
          >
            {isPending && <LoaderCircle className="animate-spin" />}
            Update account order
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
