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

import { editPortfolioAccount, newPortfolioAccount } from '@/lib/actions';
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
import { Input } from '@/components/ui/input';

const formSchema = z.object({
  name: z
    .string()
    .nonempty('Account name is required')
    .max(50, 'Maximum 50 characters'),
});

export default function AddEditPortfolioAccountDialog({
  account,
  children,
}: {
  account?: { id: number; name: string };
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const defaultValues = useMemo(
    () => (account ? { ...account } : { name: '' }),
    [account],
  );
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues,
  });
  const [, onSubmit, isPending] = useActionState(
    async (previousState: null, values: z.infer<typeof formSchema>) => {
      let error: Awaited<ReturnType<typeof newPortfolioAccount>> = null;
      if (account) {
        error = await editPortfolioAccount({
          id: account.id,
          name: values.name,
        });
      } else {
        error = await newPortfolioAccount({ name: values.name });
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
      // Have to pass default values in case account changes.
      form.reset(defaultValues);
    }
  }, [isOpen, form, defaultValues]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {children}
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{account ? 'Edit Account' : 'New Account'}</DialogTitle>
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
                  <FormLabel>Account name</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={isPending} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
        <DialogFooter>
          <Button
            disabled={isPending}
            onClick={() => formRef.current?.requestSubmit()}
          >
            {isPending && <LoaderCircle className="animate-spin" />}
            {account ? 'Edit account' : 'Create account'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
