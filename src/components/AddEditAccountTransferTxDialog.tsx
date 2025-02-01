'use client';

import {
  startTransition,
  useActionState,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { format } from 'date-fns';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Calendar as CalendarIcon, LoaderCircle } from 'lucide-react';

import { editAccountTransferTx, newAccountTransferTx } from '@/lib/actions';
import {
  convertUTCDate,
  formatDecimalPlaces,
  getCurrentDate,
  sumFloats,
} from '@/lib/utils';
import { useResourceStore } from '@/providers/resource-store-provider';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

export type Transaction = {
  accountTransferTransaction: { id: number };
  transaction: {
    id: number;
    title: string;
    description: string | null;
    date: Date;
  };
  targetAssetEntry: { amount: string };
  feeIncomeEntry: { amount: string } | null;
  sourcePortfolioAccount: { id: number; name: string };
  targetPortfolioAccount: { id: number; name: string };
  asset: { id: number; ticker: string; precision: number };
};

const formSchema = z
  .object({
    date: z.date({ message: 'Select a date' }),
    sourceAccountId: z.coerce
      .number({ message: 'Select a portfolio account' })
      .int(),
    targetAccountId: z.coerce
      .number({ message: 'Select a portfolio account' })
      .int(),
    assetId: z.coerce.number({ message: 'Select an asset' }).int(),
    amount: z.coerce
      .number({ message: 'Amount is required' })
      .positive('Must be a positive number'),
    fee: z.coerce.number().nonnegative('Must be a non-negative number'),
    isFeeInclusive: z.boolean(),
    description: z.string().trim().max(200, 'Maximum 200 characters'),
  })
  .refine((form) => form.sourceAccountId !== form.targetAccountId, {
    message: 'Source and target accounts cannot be the same',
    path: ['targetAccountId'],
  });

export default function AddEditAccountTransferTransactionDialog({
  transaction,
  children,
}: {
  transaction?: Transaction;
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const portfolioAccounts = useResourceStore(
    (state) => state.portfolioAccounts,
  );
  const assets = useResourceStore((state) => state.assets);
  const formRef = useRef<HTMLFormElement>(null);
  const defaultValues = useMemo(
    () =>
      transaction
        ? {
            date: convertUTCDate(transaction.transaction.date),
            sourceAccountId: transaction.sourcePortfolioAccount.id,
            targetAccountId: transaction.targetPortfolioAccount.id,
            assetId: transaction.asset.id,
            amount: parseFloat(transaction.targetAssetEntry.amount),
            fee: transaction.feeIncomeEntry
              ? parseFloat(transaction.feeIncomeEntry.amount)
              : 0,
            isFeeInclusive: false,
            description: transaction.transaction.description || '',
          }
        : {
            date: getCurrentDate(),
            sourceAccountId: portfolioAccounts[0]?.id,
            targetAccountId:
              portfolioAccounts[1]?.id ?? portfolioAccounts[0]?.id,
            assetId: assets[0]?.id,
            amount: 0,
            fee: 0,
            isFeeInclusive: false,
            description: '',
          },
    [transaction, portfolioAccounts, assets],
  );
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues,
  });
  const selectedAssetId: number | string = form.watch('assetId');
  const selectedAsset = useMemo(
    () => assets.find((asset) => asset.id === Number(selectedAssetId)),
    [assets, selectedAssetId],
  );
  const isFeeInclusive = form.watch('isFeeInclusive');
  // Field values may not be coerced to numbers.
  const amount: number | string = form.watch('amount');
  const fee: number | string = form.watch('fee');
  const totalTransferred = useMemo(() => {
    if (!isFeeInclusive) {
      return Number(amount);
    }
    if (selectedAsset) {
      return sumFloats(Number(amount), -Number(fee), selectedAsset.precision);
    }
    return Number(amount) - Number(fee);
  }, [isFeeInclusive, amount, fee, selectedAsset]);
  const [, onSubmit, isPending] = useActionState(
    async (previousState: null, values: z.infer<typeof formSchema>) => {
      const data = {
        sourcePortfolioAccountId: values.sourceAccountId,
        targetPortfolioAccountId: values.targetAccountId,
        assetId: values.assetId,
        // Day-picker date is local, convert to UTC 00:00:00 time.
        date: new Date(`${format(values.date, 'yyyy-MM-dd')} Z`),
        amount: values.isFeeInclusive
          ? sumFloats(values.amount, -values.fee, selectedAsset!.precision)
          : values.amount,
        fee: values.fee || null,
        description: values.description || null,
      };
      if (transaction) {
        await editAccountTransferTx({
          id: transaction.accountTransferTransaction.id,
          ...data,
        });
      } else {
        await newAccountTransferTx(data);
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
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {transaction ? 'Edit Account Transfer' : 'New Account Transfer'}
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
                <FormItem className="flex flex-col">
                  <FormLabel>Date *</FormLabel>
                  <Popover modal>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button variant="outline" disabled={isPending}>
                          {field.value ? (
                            format(field.value, 'yyyy/MM/dd')
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="sourceAccountId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Source Account *</FormLabel>
                    <Select
                      {...field}
                      value={`${field.value}`}
                      onValueChange={field.onChange}
                      disabled={isPending}
                    >
                      <FormControl>
                        <SelectTrigger>
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
                name="targetAccountId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target Account *</FormLabel>
                    <Select
                      {...field}
                      value={`${field.value}`}
                      onValueChange={field.onChange}
                      disabled={isPending}
                    >
                      <FormControl>
                        <SelectTrigger>
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
            </div>
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
                      <SelectTrigger>
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
            <div className="grid grid-cols-2 gap-4">
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
                        step={
                          selectedAsset
                            ? 1 / 10 ** selectedAsset.precision
                            : 'any'
                        }
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
                name="fee"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fee</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step={
                          selectedAsset
                            ? 1 / 10 ** selectedAsset.precision
                            : 'any'
                        }
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
                name="isFeeInclusive"
                render={({ field }) => (
                  <FormItem className="my-2">
                    <div className="flex items-center space-x-2">
                      <FormControl>
                        <Checkbox
                          {...field}
                          value=""
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={isPending}
                        />
                      </FormControl>
                      <FormLabel className="grow">Fee inclusive</FormLabel>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            {!!Number(fee) && (
              <div className="text-muted-foreground text-sm">
                Total transferred to target account:
                <br />
                {selectedAsset
                  ? formatDecimalPlaces(
                      totalTransferred,
                      selectedAsset.precision,
                    )
                  : formatDecimalPlaces(totalTransferred, 100, false)}
              </div>
            )}
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
          <Button
            disabled={isPending}
            onClick={() => formRef.current?.requestSubmit()}
          >
            {isPending && <LoaderCircle className="animate-spin" />}
            {transaction ? 'Edit transaction' : 'Create transaction'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
