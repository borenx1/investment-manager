import { startTransition, useActionState, useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { LoaderCircle } from 'lucide-react';
import { toast } from 'sonner';

import type { SelectAsset } from '@/db/schema';
import { generatePrices } from '@/lib/actions/api';
import { useCurrencyStore } from '@/providers/currency-store-provider';
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
import { PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { DatePickerButton, DatePickerRangePopover } from '@/components/DatePicker';

const formSchema = z.object({
  frequency: z.enum(['month-start', 'month-end', 'all']),
  dateRange: z.object(
    {
      from: z.date({ message: 'Select a date range' }),
      to: z.date().optional(),
    },
    { message: 'Select a date range' },
  ),
  overwriteExisting: z.boolean(),
});

const frequencyOptions = [
  { value: 'month-start', label: 'Every month start' },
  { value: 'month-end', label: 'Every month end' },
  { value: 'all', label: 'All available dates' },
] as const;

export default function GeneratePricesDialog({
  children,
  asset,
  quoteAsset,
  onOpenChange,
  ...props
}: {
  asset: SelectAsset;
  quoteAsset: SelectAsset;
} & React.ComponentProps<typeof Dialog>) {
  const [isOpen, setIsOpen] = useState(false);
  const apiLatestDate = useCurrencyStore((state) => state.apiLatestDate);
  const fetchApiLatestDate = useCurrencyStore((state) => state.fetchApiLatestDate);
  const formRef = useRef<HTMLFormElement>(null);
  const defaultValues = useMemo(
    () => ({
      frequency: 'month-end' as const,
      dateRange: {
        from: apiLatestDate ? new Date(`${apiLatestDate} 00:00:00`) : new Date(),
        to: apiLatestDate ? new Date(`${apiLatestDate} 00:00:00`) : new Date(),
      },
      overwriteExisting: false,
    }),
    [apiLatestDate],
  );
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const [, onSubmit, isPending] = useActionState(
    async (previousState: null, values: z.infer<typeof formSchema>) => {
      const result = await generatePrices({
        assetId: asset.id,
        quoteAssetId: quoteAsset.id,
        frequency: values.frequency,
        fromDate: values.dateRange.from,
        toDate: values.dateRange.to || values.dateRange.from,
        overwriteExisting: values.overwriteExisting,
      });

      if ('message' in result) {
        switch (result.message) {
          case 'No dates to generate prices for': {
            form.setError(
              'dateRange',
              { message: 'No available dates to generate prices for' },
              { shouldFocus: true },
            );
            break;
          }
          case 'No new prices to generate': {
            form.setError(
              'dateRange',
              {
                message: 'No new prices to generate, turn on "Update existing" to overwrite prices',
              },
              { shouldFocus: true },
            );
            break;
          }
          default: {
            console.error(result.message);
            toast.error('Error generating prices', {
              description: result.message,
            });
          }
        }
        return null;
      }
      setIsOpen(false);
      return null;
    },
    null,
  );

  useEffect(() => {
    if (isOpen) {
      form.reset(defaultValues);
    }
  }, [isOpen, form, defaultValues]);

  // Fetch the latest date in case it has changed.
  useEffect(() => {
    fetchApiLatestDate();
  }, [fetchApiLatestDate]);

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
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Generate Prices</DialogTitle>
          <DialogDescription>
            Automatically generate prices for {asset.ticker} / {quoteAsset.ticker} from the
            internet.
          </DialogDescription>
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
              name="frequency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Frequency</FormLabel>
                  <Select {...field} onValueChange={field.onChange} disabled={isPending}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {frequencyOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
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
              name="dateRange"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date Range</FormLabel>
                  <DatePickerRangePopover
                    modal
                    selected={field.value}
                    fromDate={new Date(2000, 1, 1)}
                    toDate={apiLatestDate ? new Date(`${apiLatestDate} 00:00:00`) : new Date()}
                    onSelect={field.onChange}
                  >
                    <PopoverTrigger asChild>
                      <FormControl>
                        <DatePickerButton selected={field.value} disabled={isPending} />
                      </FormControl>
                    </PopoverTrigger>
                  </DatePickerRangePopover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="overwriteExisting"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between gap-2 rounded-lg border px-3 py-4">
                  <div className="space-y-1">
                    <FormLabel>Update existing</FormLabel>
                    <FormDescription>Replace existing prices in the date range</FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isPending}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <input type="submit" className="hidden" hidden />
          </form>
        </Form>
        <DialogFooter>
          <Button disabled={isPending} onClick={() => formRef.current?.requestSubmit()}>
            {isPending && <LoaderCircle className="animate-spin" />}
            Generate prices
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
