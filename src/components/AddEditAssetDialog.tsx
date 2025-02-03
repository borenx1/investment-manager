'use client';

import {
  startTransition,
  useActionState,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { LoaderCircle } from 'lucide-react';

import { editAsset, newAsset } from '@/lib/actions';
import { assetForm } from '@/lib/forms';
import { Button } from '@/components/ui/button';
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

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
  };
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const defaultValues = useMemo(
    () =>
      asset
        ? { ...asset, symbol: asset.symbol ?? '' }
        : {
            name: '',
            ticker: '',
            symbol: '',
            precision: 0,
            pricePrecision: 0,
            isCurrency: false,
          },
    [asset],
  );
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues,
  });
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
      };
      if (asset) {
        error = await editAsset(asset.id, data);
      } else {
        error = await newAsset(data);
      }
      if (error) {
        switch (error.message) {
          case 'Duplicate name': {
            form.setError(
              'name',
              { message: 'Name already exists' },
              { shouldFocus: true },
            );
            break;
          }
          case 'Duplicate ticker': {
            form.setError(
              'ticker',
              { message: 'Ticker already exists' },
              { shouldFocus: true },
            );
            break;
          }
          case 'Duplicate symbol': {
            form.setError(
              'symbol',
              { message: 'Symbol already exists' },
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
    }
  }, [isOpen, form, defaultValues]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {children}
      <DialogContent className="max-w-sm">
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
            <div className="grid grid-cols-2 gap-4">
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
              <div></div>
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
          <Button
            disabled={isPending}
            onClick={() => formRef.current?.requestSubmit()}
          >
            {isPending && <LoaderCircle className="animate-spin" />}
            {asset ? 'Edit asset' : 'Create asset'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
