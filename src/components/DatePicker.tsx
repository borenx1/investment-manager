import { useState } from 'react';
import { format } from 'date-fns';
import type { DayPickerSingleProps } from 'react-day-picker';
import { Calendar as CalendarIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent } from '@/components/ui/popover';

export type DatePickerPopoverProps = Pick<
  DayPickerSingleProps,
  'selected' | 'onSelect' | 'required'
> &
  React.ComponentProps<typeof Popover>;

export function DatePickerPopover({
  children,
  onOpenChange,
  selected,
  onSelect,
  required,
  ...props
}: DatePickerPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Popover
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        onOpenChange?.(open);
      }}
      {...props}
    >
      {children}
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={(...args) => {
            onSelect?.(...args);
            setIsOpen(false);
            onOpenChange?.(false);
          }}
          defaultMonth={selected}
          required={required}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}

export function DatePickerButton({
  selected,
  ...props
}: { selected?: Date } & React.ComponentProps<typeof Button>) {
  return (
    <Button type="button" variant="outline" {...props}>
      {selected ? format(selected, 'yyyy/MM/dd') : <span>Pick a date</span>}
      <CalendarIcon className="ml-auto opacity-50" />
    </Button>
  );
}
