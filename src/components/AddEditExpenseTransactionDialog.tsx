'use client';

import { startTransition, useActionState, useEffect, useMemo, useRef, useState } from 'react';
import { format } from 'date-fns';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { LoaderCircle } from 'lucide-react';

import { editExpenseTransaction, newExpenseTransaction } from '@/lib/actions';
import { expenseTransactionForm } from '@/lib/forms';
import { convertUTCDate, getCurrentDate } from '@/lib/utils';
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
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { Transaction } from '@/components/AddEditIncomeTransactionDialog';
import { DatePickerButton, DatePickerPopover } from '@/components/DatePicker';

export type { Transaction };

const formSchema = expenseTransactionForm.clientSchema;

export default function AddEditExpenseTransactionDialog({
  transaction,
  children,
}: {
  transaction?: Transaction;
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const portfolioAccounts = useResourceStore((state) => state.portfolioAccounts);
  const assets = useResourceStore((state) => state.assets);
  const activeAccount = useResourceStore((state) => state.activeAccount);
  const formRef = useRef<HTMLFormElement>(null);
  const defaultValues = useMemo(
    () =>
      transaction
        ? {
            date: convertUTCDate(transaction.transaction.date),
            portfolioAccountId: transaction.portfolioAccount.id,
            assetId: transaction.asset.id,
            amount: -parseFloat(transaction.assetEntry.amount),
            description: transaction.transaction.description || '',
          }
        : {
            date: getCurrentDate(),
            portfolioAccountId: activeAccount?.id ?? portfolioAccounts[0]?.id,
            assetId: assets[0]?.id,
            amount: 0,
            description: '',
          },
    [transaction, portfolioAccounts, assets, activeAccount],
  );
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues,
  });
  const selectedAssetId = form.watch('assetId');
  const selectedAsset = useMemo(
    () => assets.find((asset) => asset.id === Number(selectedAssetId)),
    [assets, selectedAssetId],
  );
  const [, onSubmit, isPending] = useActionState(
    async (previousState: null, values: z.infer<typeof formSchema>) => {
      const data = {
        ...values,
        // Day-picker date is local, convert to UTC 00:00:00 time.
        date: new Date(`${format(values.date, 'yyyy-MM-dd')} Z`),
        description: values.description || null,
      };
      if (transaction) {
        await editExpenseTransaction(transaction.incomeTransaction.id, data);
      } else {
        await newExpenseTransaction(data);
      }
      setIsOpen(false);
      return null;
    },
    null,
  );

  useEffect(() => {
    if (isOpen) {
      // Have to pass default values in case transaction changes.
      form.reset(defaultValues);
    }
  }, [isOpen, form, defaultValues]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {children}
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {transaction ? 'Edit Expense Transaction' : 'New Expense Transaction'}
          </DialogTitle>
          <DialogDescription className="hidden" />
        </DialogHeader>
        <Form {...form}>
          <form
            ref={formRef}
            onSubmit={form.handleSubmit((payload) => {
              startTransition(() => onSubmit(payload));
            })}
            className="space-y-4 py-4"
          >
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date *</FormLabel>
                  <DatePickerPopover
                    modal
                    selected={field.value}
                    onSelect={field.onChange}
                    required
                  >
                    <PopoverTrigger asChild>
                      <FormControl>
                        <DatePickerButton selected={field.value} disabled={isPending} />
                      </FormControl>
                    </PopoverTrigger>
                  </DatePickerPopover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="portfolioAccountId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Portfolio Account *</FormLabel>
                  <Select
                    {...field}
                    value={`${field.value}`}
                    onValueChange={field.onChange}
                    disabled={isPending}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a portfolio account" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {portfolioAccounts.map((account) => (
                        <SelectItem key={account.id} value={`${account.id}`}>
                          {account.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="assetId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Asset *</FormLabel>
                  <Select
                    {...field}
                    value={`${field.value}`}
                    onValueChange={field.onChange}
                    disabled={isPending}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select an asset" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {assets.map((asset) => (
                        <SelectItem key={asset.id} value={`${asset.id}`}>
                          {asset.ticker}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      step={selectedAsset ? 1 / 10 ** selectedAsset.precision : 'any'}
                      {...field}
                      disabled={isPending}
                    />
                  </FormControl>
                  {selectedAsset && (
                    <FormDescription>Max {selectedAsset.precision} decimal places</FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea {...field} disabled={isPending} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <input type="submit" className="hidden" hidden />
          </form>
        </Form>
        <DialogFooter>
          <Button disabled={isPending} onClick={() => formRef.current?.requestSubmit()}>
            {isPending && <LoaderCircle className="animate-spin" />}
            {transaction ? 'Edit transaction' : 'Create transaction'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
