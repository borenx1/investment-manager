'use client';

import {
  startTransition,
  useActionState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { format } from 'date-fns';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { LoaderCircle } from 'lucide-react';

import { editTradeTransaction, newTradeTransaction } from '@/lib/actions';
import { tradeTransactionForm } from '@/lib/forms';
import { convertUTCDate, formatDecimalPlaces, getCurrentDate, roundNumber } from '@/lib/utils';
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
  tradeTransaction: { id: number };
  transaction: {
    id: number;
    title: string;
    description: string | null;
    date: Date;
  };
  portfolioAccount: { id: number; name: string };
  baseAssetEntry: { amount: string };
  quoteAssetEntry: { amount: string };
  feeIncomeEntry: { amount: string } | null;
  baseAsset: {
    id: number;
    ticker: string;
    precision: number;
    pricePrecision: number;
  };
  quoteAsset: {
    id: number;
    ticker: string;
    precision: number;
    pricePrecision: number;
  };
  feeAsset: {
    id: number;
    ticker: string;
    precision: number;
    pricePrecision: number;
  } | null;
};

const formSchema = tradeTransactionForm.clientSchema;

export default function AddEditTradeTransactionDialog({
  transaction,
  children,
}: {
  transaction?: Transaction;
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDateOpen, setIsDateOpen] = useState(false);
  const [price, setPrice] = useState('');
  const portfolioAccounts = useResourceStore((state) => state.portfolioAccounts);
  const assets = useResourceStore((state) => state.assets);
  const accountingCurrency = useResourceStore((state) => state.accountingCurrency);
  const activeAccount = useResourceStore((state) => state.activeAccount);
  const formRef = useRef<HTMLFormElement>(null);
  const defaultValues = useMemo(
    () =>
      transaction
        ? {
            date: convertUTCDate(transaction.transaction.date),
            portfolioAccountId: transaction.portfolioAccount.id,
            baseAssetId: transaction.baseAsset.id,
            baseAmount: Math.abs(parseFloat(transaction.baseAssetEntry.amount)),
            quoteAssetId: transaction.quoteAsset.id,
            quoteAmount: Math.abs(parseFloat(transaction.quoteAssetEntry.amount)),
            type:
              parseFloat(transaction.baseAssetEntry.amount) >= 0
                ? ('buy' as const)
                : ('sell' as const),
            feeAsset: transaction.feeAsset
              ? transaction.feeAsset.id === transaction.baseAsset.id
                ? ('base' as const)
                : ('quote' as const)
              : ('quote' as const),
            feeAmount: transaction.feeIncomeEntry
              ? parseFloat(transaction.feeIncomeEntry.amount)
              : 0,
            description: transaction.transaction.description || '',
          }
        : {
            date: getCurrentDate(),
            portfolioAccountId: activeAccount?.id ?? portfolioAccounts[0]?.id,
            baseAssetId: accountingCurrency
              ? (assets.filter((a) => a.id !== accountingCurrency.id)[0]?.id ?? assets[0]?.id)
              : assets[0]?.id,
            baseAmount: 0,
            quoteAssetId: accountingCurrency?.id ?? assets[0]?.id,
            quoteAmount: 0,
            type: 'buy' as const,
            feeAsset: 'quote' as const,
            feeAmount: 0,
            description: '',
          },
    [transaction, portfolioAccounts, assets, accountingCurrency, activeAccount],
  );
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues,
  });
  const selectedBaseAssetId = form.watch('baseAssetId');
  const selectedQuoteAssetId = form.watch('quoteAssetId');
  const selectedFeeAssetOption = form.watch('feeAsset');
  const selectedBaseAsset = useMemo(
    () => assets.find((asset) => asset.id === Number(selectedBaseAssetId)),
    [assets, selectedBaseAssetId],
  );
  const selectedQuoteAsset = useMemo(
    () => assets.find((asset) => asset.id === Number(selectedQuoteAssetId)),
    [assets, selectedQuoteAssetId],
  );
  const selectedFeeAsset = useMemo(
    () => (selectedFeeAssetOption === 'base' ? selectedBaseAsset : selectedQuoteAsset),
    [selectedFeeAssetOption, selectedBaseAsset, selectedQuoteAsset],
  );
  const [, onSubmit, isPending] = useActionState(
    async (previousState: null, values: z.infer<typeof formSchema>) => {
      const data = {
        ...values,
        // Day-picker date is local, convert to UTC 00:00:00 time.
        date: new Date(`${format(values.date, 'yyyy-MM-dd')} Z`),
        feeAmount: values.feeAmount || null,
        description: values.description || null,
      };
      if (transaction) {
        await editTradeTransaction(transaction.tradeTransaction.id, data);
      } else {
        await newTradeTransaction(data);
      }
      setIsOpen(false);
      return null;
    },
    null,
  );

  const handleUpdateBaseAmount = useCallback(
    (baseAmount: string | number) => {
      const priceValue = Math.abs(Number(price));
      if (!priceValue || !isFinite(priceValue)) return;
      baseAmount = Math.abs(Number(baseAmount));
      if (!isFinite(baseAmount)) return;
      const newQuoteAmount = baseAmount * priceValue;
      form.setValue('quoteAmount', roundNumber(newQuoteAmount, selectedQuoteAsset?.precision ?? 2));
    },
    [form, price, selectedQuoteAsset],
  );

  const handleUpdateQuoteAmount = useCallback(
    (quoteAmount: string | number) => {
      quoteAmount = Math.abs(Number(quoteAmount));
      if (!quoteAmount || !isFinite(quoteAmount)) return;
      const baseAmount = Math.abs(Number(form.getValues('baseAmount')));
      if (!baseAmount || !isFinite(baseAmount)) return;
      const newPrice = quoteAmount / baseAmount;
      setPrice(
        formatDecimalPlaces(newPrice, selectedBaseAsset?.pricePrecision ?? 2, {
          trailingZeros: false,
          useGrouping: false,
        }),
      );
    },
    [form, selectedBaseAsset],
  );

  const handleUpdatePrice = useCallback(
    (newPrice: string | number) => {
      newPrice = Math.abs(Number(newPrice));
      if (!newPrice || !isFinite(newPrice)) return;
      const baseAmount = Math.abs(Number(form.getValues('baseAmount')));
      if (!isFinite(baseAmount)) return;
      const newQuoteAmount = baseAmount * newPrice;
      form.setValue('quoteAmount', roundNumber(newQuoteAmount, selectedQuoteAsset?.precision ?? 2));
    },
    [form, selectedQuoteAsset],
  );

  useEffect(() => {
    if (isOpen) {
      // Have to pass default values in case transaction changes.
      form.reset(defaultValues);
      setPrice('');
      handleUpdateQuoteAmount(defaultValues.quoteAmount);
    }
    // Do not include `handleUpdateQuoteAmount` or form will reset when base changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, form, defaultValues]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {children}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {transaction ? 'Edit Trade Transaction' : 'New Trade Transaction'}
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
                  <FormLabel className="w-fit">Date *</FormLabel>
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
            <div className="grid grid-cols-2 gap-2">
              <FormField
                control={form.control}
                name="baseAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step={selectedBaseAsset ? 1 / 10 ** selectedBaseAsset.precision : 'any'}
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          handleUpdateBaseAmount(e.target.value);
                        }}
                        disabled={isPending}
                      />
                    </FormControl>
                    {selectedBaseAsset && (
                      <FormDescription>
                        Max {selectedBaseAsset.precision} decimal places
                      </FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="baseAssetId"
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
                name="quoteAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step={selectedQuoteAsset ? 1 / 10 ** selectedQuoteAsset.precision : 'any'}
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          handleUpdateQuoteAmount(e.target.value);
                        }}
                        disabled={isPending}
                      />
                    </FormControl>
                    {selectedQuoteAsset && (
                      <FormDescription>
                        Max {selectedQuoteAsset.precision} decimal places
                      </FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="quoteAssetId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quote *</FormLabel>
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
              <FormItem>
                <FormLabel htmlFor="price">Price</FormLabel>
                <FormControl>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step={selectedBaseAsset ? 1 / 10 ** selectedBaseAsset.pricePrecision : 'any'}
                    value={price}
                    onChange={(e) => {
                      setPrice(e.target.value);
                      handleUpdatePrice(e.target.value);
                    }}
                    disabled={isPending}
                  />
                </FormControl>
              </FormItem>
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
                        <SelectItem value="buy">Buy</SelectItem>
                        <SelectItem value="sell">Sell</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="feeAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fee</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step={selectedFeeAsset ? 1 / 10 ** selectedFeeAsset.precision : 'any'}
                        {...field}
                        disabled={isPending}
                      />
                    </FormControl>
                    {selectedFeeAsset && (
                      <FormDescription>
                        Max {selectedFeeAsset.precision} decimal places
                      </FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="feeAsset"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fee currency</FormLabel>
                    <Select {...field} onValueChange={field.onChange} disabled={isPending}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="base">
                          {selectedBaseAsset ? `Base (${selectedBaseAsset.ticker})` : 'Base'}
                        </SelectItem>
                        <SelectItem value="quote">
                          {selectedQuoteAsset ? `Quote (${selectedQuoteAsset.ticker})` : 'Quote'}
                        </SelectItem>
                      </SelectContent>
                    </Select>
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
