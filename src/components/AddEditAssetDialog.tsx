'use client';

import { startTransition, useActionState, useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Check, ChevronsUpDown, LoaderCircle } from 'lucide-react';

import { editAsset, newAsset } from '@/lib/actions';
import { MAX_ASSETS } from '@/lib/constants';
import { assetForm } from '@/lib/forms';
import { cn } from '@/lib/utils';
import { useCurrencyStore } from '@/providers/currency-store-provider';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const formSchema = assetForm.clientSchema;

export default function AddEditAssetDialog({
  asset,
  children,
}: {
  asset?: {
    id: number;
    ticker: string;
    name: string;
    symbol: string | null;
    precision: number;
    pricePrecision: number;
    isCurrency: boolean;
    externalTicker: string | null;
  };
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLinkRealAsset, setIsLinkRealAsset] = useState(false);
  const [isExternalTickerOpen, setIsExternalTickerOpen] = useState(false);
  const apiCurrencies = useCurrencyStore((state) => state.apiCurrencies);
  const apiCurrencyOptions = useMemo(
    () =>
      Object.entries(apiCurrencies).map(([ticker, name]) => ({
        value: ticker,
        label: `${ticker.toUpperCase()} - ${name}`,
      })),
    [apiCurrencies],
  );
  const formRef = useRef<HTMLFormElement>(null);
  const defaultValues = useMemo(
    () =>
      asset
        ? {
            ...asset,
            symbol: asset.symbol ?? '',
            externalTicker: asset.externalTicker,
          }
        : {
            name: '',
            ticker: '',
            symbol: '',
            precision: 0,
            pricePrecision: 0,
            isCurrency: false,
            externalTicker: null,
          },
    [asset],
  );
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues,
  });
  const tickerRaw = form.watch('ticker');
  const ticker = useMemo(() => tickerRaw.trim().toLowerCase(), [tickerRaw]);
  const [, onSubmit, isPending] = useActionState(
    async (previousState: null, values: z.infer<typeof formSchema>) => {
      let error: Awaited<ReturnType<typeof newAsset>> = null;
      const data = {
        ticker: values.ticker,
        name: values.name,
        symbol: values.symbol || null,
        precision: values.precision,
        pricePrecision: values.pricePrecision,
        isCurrency: values.isCurrency,
        externalTicker: isLinkRealAsset ? values.externalTicker || null : null,
      };
      if (asset) {
        error = await editAsset(asset.id, data);
      } else {
        error = await newAsset(data);
      }
      if (error) {
        switch (error.message) {
          case 'Duplicate name': {
            form.setError('name', { message: 'Name already exists' }, { shouldFocus: true });
            break;
          }
          case 'Duplicate ticker': {
            form.setError('ticker', { message: 'Ticker already exists' }, { shouldFocus: true });
            break;
          }
          case 'Duplicate symbol': {
            form.setError('symbol', { message: 'Symbol already exists' }, { shouldFocus: true });
            break;
          }
          case 'Maximum number of assets reached': {
            form.setError(
              'name',
              {
                message: `Maximum number of assets reached: ${MAX_ASSETS}`,
              },
              { shouldFocus: true },
            );
            break;
          }
          default: {
            console.error(error);
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
      // Have to pass default values in case asset changes.
      form.reset(defaultValues);
      setIsLinkRealAsset(!!defaultValues.externalTicker);
    }
  }, [isOpen, form, defaultValues]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {children}
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{asset ? 'Edit Asset' : 'New Asset'}</DialogTitle>
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
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name *</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={isPending} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-x-2 gap-y-4">
              <FormField
                control={form.control}
                name="ticker"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ticker *</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={isPending} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="symbol"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Symbol</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={isPending} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormItem className="my-2">
                <div className="flex items-center space-x-2">
                  <FormControl>
                    <Checkbox
                      value=""
                      checked={isLinkRealAsset}
                      onCheckedChange={(checked) => {
                        setIsLinkRealAsset(!!checked);
                        if (
                          checked &&
                          !form.getValues('externalTicker') &&
                          ticker in apiCurrencies
                        ) {
                          form.setValue('externalTicker', ticker);
                        }
                      }}
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormLabel className="grow">Link real asset</FormLabel>
                </div>
                <FormMessage />
              </FormItem>
              <FormField
                control={form.control}
                name="isCurrency"
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
                      <FormLabel className="grow">Currency</FormLabel>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {isLinkRealAsset && (
                <FormField
                  control={form.control}
                  name="externalTicker"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Real asset ticker</FormLabel>
                      <Popover
                        open={isExternalTickerOpen}
                        onOpenChange={setIsExternalTickerOpen}
                        modal
                      >
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              type="button"
                              variant="outline"
                              role="combobox"
                              className={cn(
                                'justify-between font-normal',
                                !field.value && 'text-muted-foreground',
                              )}
                              disabled={isPending}
                            >
                              {field.value
                                ? (apiCurrencyOptions.find((option) => option.value === field.value)
                                    ?.label ?? field.value.toUpperCase())
                                : 'Select a ticker'}
                              <ChevronsUpDown className="opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent align="start" className="w-auto p-0">
                          <Command>
                            <CommandInput placeholder="Search ticker..." />
                            <CommandList>
                              <CommandEmpty>No results found.</CommandEmpty>
                              <CommandGroup>
                                {apiCurrencyOptions.map((option) => (
                                  <CommandItem
                                    key={option.value}
                                    value={option.label}
                                    onSelect={() => {
                                      form.setValue(
                                        'externalTicker',
                                        field.value !== option.value ? option.value : null,
                                      );
                                      setIsExternalTickerOpen(false);
                                    }}
                                  >
                                    {option.label}
                                    <Check
                                      className={cn(
                                        'ml-auto',
                                        option.value === field.value ? 'opacity-100' : 'opacity-0',
                                      )}
                                    />
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FormDescription>
                        Link to a real asset to automatically get prices.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              <FormField
                control={form.control}
                name="precision"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Precision *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        max="20"
                        step="1"
                        {...field}
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="pricePrecision"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price precision *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        max="20"
                        step="1"
                        {...field}
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <input type="submit" className="hidden" hidden />
          </form>
        </Form>
        <DialogFooter>
          <Button disabled={isPending} onClick={() => formRef.current?.requestSubmit()}>
            {isPending && <LoaderCircle className="animate-spin" />}
            {asset ? 'Edit asset' : 'Create asset'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
