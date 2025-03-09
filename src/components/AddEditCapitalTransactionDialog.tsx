'use client';

import { startTransition, useActionState, useEffect, useMemo, useRef, useState } from 'react';
import { format } from 'date-fns';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { LoaderCircle } from 'lucide-react';

import { editCapitalTransaction, newCapitalTransaction } from '@/lib/actions';
import { capitalTransactionForm } from '@/lib/forms';
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
import { PopoverAnchor } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { DatePickerButton, DatePickerPopover } from '@/components/DatePicker';

export type Transaction = {
  capitalTransaction: { id: number };
  transaction: {
    id: number;
    title: string;
    description: string | null;
    date: Date;
  };
  assetEntry: { amount: string };
  feeIncomeEntry: { amount: string } | null;
  portfolioAccount: { id: number; name: string };
  asset: { id: number; ticker: string; precision: number };
};

const formSchema = capitalTransactionForm.clientSchema;

export default function AddEditCapitalTransactionDialog({
  transaction,
  children,
}: {
  transaction?: Transaction;
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDateOpen, setIsDateOpen] = useState(false);
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
            amount: Math.abs(parseFloat(transaction.assetEntry.amount)),
            type:
              parseFloat(transaction.assetEntry.amount) >= 0
                ? ('contributions' as const)
                : ('drawings' as const),
            fee: transaction.feeIncomeEntry ? parseFloat(transaction.feeIncomeEntry.amount) : 0,
            description: transaction.transaction.description || '',
          }
        : {
            date: getCurrentDate(),
            portfolioAccountId: activeAccount?.id ?? portfolioAccounts[0]?.id,
            assetId: assets[0]?.id,
            amount: 0,
            type: 'contributions' as const,
            fee: 0,
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
        fee: values.fee || null,
        description: values.description || null,
      };
      if (transaction) {
        await editCapitalTransaction(transaction.capitalTransaction.id, data);
      } else {
        await newCapitalTransaction(data);
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
            {transaction ? 'Edit Capital Transaction' : 'New Capital Transaction'}
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
                  <FormControl>
                    <DatePickerButton
                      selected={field.value}
                      disabled={isPending}
                      onClick={() => setIsDateOpen(true)}
                    />
                  </FormControl>
                  {isDateOpen && (
                    <DatePickerPopover
                      open={true}
                      onOpenChange={setIsDateOpen}
                      modal
                      selected={field.value}
                      onSelect={field.onChange}
                      required
                    >
                      <PopoverAnchor className="-mt-2" />
                    </DatePickerPopover>
                  )}
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
            <div className="grid grid-cols-2 gap-x-2 gap-y-4">
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
                      <FormDescription>
                        Max {selectedAsset.precision} decimal places
                      </FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type *</FormLabel>
                    <Select {...field} onValueChange={field.onChange} disabled={isPending}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="contributions">Contributions</SelectItem>
                        <SelectItem value="drawings">Drawings</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="fee"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fee</FormLabel>
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
                      <FormDescription>
                        Max {selectedAsset.precision} decimal places
                      </FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
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
