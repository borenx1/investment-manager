'use client';

import { useState, useTransition } from 'react';
import { LoaderCircle } from 'lucide-react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

/**
 * An alert dialog that waits for the action to be completed before closing.
 */
export default function ActionAlertDialog({
  children,
  title,
  description,
  actionText = 'Continue',
  cancelText = 'Cancel',
  onAction,
  onOpenChange,
  ...props
}: React.ComponentProps<typeof AlertDialog> & {
  children?: React.ReactNode;
  title?: string;
  description?: string | React.ReactNode;
  actionText?: string;
  cancelText?: string;
  onAction?: () => void | Promise<void>;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  return (
    <AlertDialog
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        onOpenChange?.(open);
      }}
      {...props}
    >
      {children}
      <AlertDialogContent>
        {!!(title || description) && (
          <AlertDialogHeader>
            {!!title && <AlertDialogTitle>{title}</AlertDialogTitle>}
            {!!description && <AlertDialogDescription>{description}</AlertDialogDescription>}
          </AlertDialogHeader>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel>{cancelText}</AlertDialogCancel>
          <AlertDialogAction
            disabled={isPending}
            onClick={
              onAction
                ? (e) => {
                    e.preventDefault();
                    startTransition(async () => {
                      await Promise.resolve(onAction());
                      setIsOpen(false);
                      onOpenChange?.(false);
                    });
                  }
                : undefined
            }
          >
            {isPending && <LoaderCircle className="animate-spin" />}
            {actionText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
