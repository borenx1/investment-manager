'use client';

import { startTransition, useActionState, useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { LoaderCircle } from 'lucide-react';

import { editAccountingCurrency } from '@/lib/actions';
import { accountingCurrencyForm } from '@/lib/forms';
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

const formSchema = accountingCurrencyForm.clientSchema;

export default function AccountingCurrencyDialog({
  children,
  onOpenChange,
  ...props
}: React.ComponentProps<typeof Dialog>) {
  const [isOpen, setIsOpen] = useState(false);
  const accountingCurrency = useResourceStore((state) => state.accountingCurrency);
  const assets = useResourceStore((state) => state.assets);
  const isAccountingCurrencyLoaded = useResourceStore((state) => state.isAccountingCurrencyLoaded);
  const isAssetsLoaded = useResourceStore((state) => state.isAssetsLoaded);
  const isResourcesLoaded = useMemo(
    () => isAccountingCurrencyLoaded && isAssetsLoaded,
    [isAccountingCurrencyLoaded, isAssetsLoaded],
  );
  const formRef = useRef<HTMLFormElement>(null);
  const defaultValues = useMemo(
    () => (accountingCurrency ? { assetId: accountingCurrency.id } : { assetId: assets[0]?.id }),
    [accountingCurrency, assets],
  );
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues,
  });
  const [, onSubmit, isPending] = useActionState(
    async (previousState: null, values: z.infer<typeof formSchema>) => {
      await editAccountingCurrency({ assetId: values.assetId });
      setIsOpen(false);
      onOpenChange?.(false);
      return null;
    },
    null,
  );

  useEffect(() => {
    if (props.open !== undefined ? props.open : isOpen) {
      // Have to pass default values in case data changes.
      form.reset(defaultValues);
    }
  }, [props.open, isOpen, form, defaultValues]);

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
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle>Change Accounting Currency</DialogTitle>
          <DialogDescription>
            Select the asset to use as your accounting currency.
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
              name="assetId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Asset</FormLabel>
                  <Select
                    {...field}
                    value={`${field.value}`}
                    onValueChange={field.onChange}
                    disabled={isPending || !isResourcesLoaded}
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
            <input type="submit" className="hidden" hidden />
          </form>
        </Form>
        <DialogFooter>
          <Button
            disabled={isPending || !isResourcesLoaded}
            onClick={() => formRef.current?.requestSubmit()}
          >
            {isPending && <LoaderCircle className="animate-spin" />}
            Update accounting currency
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
