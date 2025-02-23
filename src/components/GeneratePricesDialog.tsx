import {
  startTransition,
  useActionState,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { LoaderCircle } from 'lucide-react';

import type { SelectAsset } from '@/db/schema';
import { getCurrentDate } from '@/lib/utils';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  DatePickerButton,
  DatePickerRangePopover,
} from '@/components/DatePicker';
import { PopoverAnchor } from '@/components/ui/popover';

const formSchema = z.object({
  frequency: z.enum(['month-start', 'month-end', 'all']),
  dateRange: z.object(
    {
      from: z.date({ message: 'Select a date range' }),
      to: z.date().optional(),
    },
    { message: 'Select a date range' },
  ),
  overrideExisting: z.boolean(),
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
  const [isDateRangeOpen, setIsDateRangeOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      frequency: 'month-end',
      dateRange: {
        from: getCurrentDate(),
        to: getCurrentDate(),
      },
      overrideExisting: false,
    },
  });

  const [, onSubmit, isPending] = useActionState(
    async (previousState: null, values: z.infer<typeof formSchema>) => {
      // TODO: Call API to generate prices
      console.log('Generating prices with options:', values);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setIsOpen(false);
      return null;
    },
    null,
  );

  useEffect(() => {
    if (isOpen) {
      form.reset();
    }
  }, [isOpen, form]);

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
          <DialogTitle>Generate Prices</DialogTitle>
          <DialogDescription>
            Automatically generate prices for {asset.ticker} /{' '}
            {quoteAsset.ticker} from the internet.
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
                  <Select
                    {...field}
                    onValueChange={field.onChange}
                    disabled={isPending}
                  >
                    <FormControl>
                      <SelectTrigger>
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
                <FormItem className="flex flex-col">
                  <FormLabel className="w-fit">Date Range</FormLabel>
                  <FormControl>
                    <DatePickerButton
                      selected={field.value}
                      disabled={isPending}
                      onClick={() => setIsDateRangeOpen(true)}
                    />
                  </FormControl>
                  {isDateRangeOpen && (
                    <DatePickerRangePopover
                      open={true}
                      onOpenChange={setIsDateRangeOpen}
                      modal
                      selected={field.value}
                      fromDate={new Date(2000, 1, 1)}
                      toDate={new Date()}
                      onSelect={(day) => {
                        field.onChange(day);
                      }}
                    >
                      <PopoverAnchor className="-mt-2" />
                    </DatePickerRangePopover>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="overrideExisting"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <FormLabel>Update existing</FormLabel>
                    <FormDescription>
                      Replace existing prices in the date range
                    </FormDescription>
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
          <Button
            disabled={isPending}
            onClick={() => formRef.current?.requestSubmit()}
          >
            {isPending && <LoaderCircle className="animate-spin" />}
            Generate prices
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
