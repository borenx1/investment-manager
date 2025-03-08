'use client';

import { startTransition, useActionState, useEffect, useMemo, useRef, useState } from 'react';
import { format } from 'date-fns';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { LoaderCircle } from 'lucide-react';

import type { SelectAsset, SelectAssetPrice } from '@/db/schema';
import { newAssetPrice } from '@/lib/actions';
import { assetPriceForm } from '@/lib/forms';
import { formatDecimalPlaces, getCurrentDate } from '@/lib/utils';
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
import { Select, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePickerButton, DatePickerPopover } from '@/components/DatePicker';

export type AssetPrice = {
  price: SelectAssetPrice;
  asset: SelectAsset;
  quote: SelectAsset;
};

const formSchema = assetPriceForm.clientSchema;

export default function AddAssetPriceDialog({
  children,
  asset,
  quoteAsset,
  prices,
  date,
  onOpenChange,
  ...props
}: {
  asset: SelectAsset;
  quoteAsset: SelectAsset;
  prices?: AssetPrice[];
  date?: Date;
} & React.ComponentProps<typeof Dialog>) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDateOpen, setIsDateOpen] = useState(false);
  const pricesMap = useMemo(() => {
    if (!prices) return {};
    return prices
      .filter(({ price }) => price.assetId === asset.id && price.quoteAssetId === quoteAsset.id)
      .reduce<Record<string, AssetPrice['price']>>((acc, { price }) => {
        acc[price.date] = price;
        return acc;
      }, {});
  }, [prices, asset, quoteAsset]);
  const formRef = useRef<HTMLFormElement>(null);
  const defaultValues = useMemo(() => {
    // Assume `date` is already in local time.
    const defaultDate = date ?? getCurrentDate();
    const originalPrice = pricesMap[format(defaultDate, 'yyyy-MM-dd')];
    return {
      date: defaultDate,
      price: originalPrice ? Number(originalPrice.price) : 0,
    };
  }, [date, pricesMap]);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues,
  });
  const selectedDate = form.watch('date');
  const existingPrice = useMemo(
    () => pricesMap[format(selectedDate, 'yyyy-MM-dd')],
    [pricesMap, selectedDate],
  );
  const [, onSubmit, isPending] = useActionState(
    async (previousState: null, values: z.infer<typeof formSchema>) => {
      await newAssetPrice({
        price: values.price,
        // Day-picker date is local, directly convert to string.
        date: format(values.date, 'yyyy-MM-dd'),
        assetId: asset.id,
        quoteAssetId: quoteAsset.id,
      });
      setIsOpen(false);
      return null;
    },
    null,
  );

  useEffect(() => {
    if (isOpen) {
      // Have to pass default values in case data changes.
      form.reset(defaultValues);
    }
  }, [isOpen, form, defaultValues]);

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
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{date ? 'Edit Asset Price' : 'Add Asset Price'}</DialogTitle>
          <DialogDescription className="hidden" hidden />
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
                  <FormLabel className="w-fit">Date</FormLabel>
                  <FormControl>
                    <DatePickerButton
                      selected={field.value}
                      disabled={!!date || isPending}
                      onClick={() => setIsDateOpen(true)}
                    />
                  </FormControl>
                  {isDateOpen && (
                    <DatePickerPopover
                      open={true}
                      onOpenChange={setIsDateOpen}
                      modal
                      selected={field.value}
                      onSelect={(day) => {
                        field.onChange(day);
                        if (day) {
                          const existingPrice = pricesMap[format(day, 'yyyy-MM-dd')];
                          if (existingPrice) {
                            form.setValue('price', Number(existingPrice.price));
                          }
                        }
                        setTimeout(() => {
                          form.setFocus('price');
                        }, 0);
                      }}
                      required
                    >
                      <PopoverAnchor className="-mt-2" />
                    </DatePickerPopover>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-2">
              <FormItem>
                <FormLabel>Asset</FormLabel>
                <Select disabled>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={asset.ticker} />
                    </SelectTrigger>
                  </FormControl>
                </Select>
              </FormItem>
              <FormItem>
                <FormLabel>Quote</FormLabel>
                <Select disabled>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={quoteAsset.ticker} />
                    </SelectTrigger>
                  </FormControl>
                </Select>
              </FormItem>
            </div>
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      step={1 / 10 ** asset.pricePrecision}
                      {...field}
                      value={field.value !== 0 ? field.value : ''}
                      disabled={isPending}
                      autoFocus
                    />
                  </FormControl>
                  <FormDescription>Max {asset.pricePrecision} decimal places</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            {existingPrice && (
              <div className="text-muted-foreground text-sm">
                Update the existing price of{' '}
                <strong>
                  {formatDecimalPlaces(Number(existingPrice.price), asset.pricePrecision, {
                    trailingZeros: true,
                  })}
                </strong>{' '}
                which was{' '}
                <strong>
                  {existingPrice.isGenerated ? 'automatically generated' : 'manually created'}
                </strong>
              </div>
            )}
            <input type="submit" className="hidden" hidden />
          </form>
        </Form>
        <DialogFooter>
          <Button disabled={isPending} onClick={() => formRef.current?.requestSubmit()}>
            {isPending && <LoaderCircle className="animate-spin" />}
            {date ? 'Edit price' : 'Add price'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
