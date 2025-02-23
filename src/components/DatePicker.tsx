import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import type {
  DayPickerRangeProps,
  DayPickerSingleProps,
  DateRange,
} from 'react-day-picker';
import { Calendar as CalendarIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent } from '@/components/ui/popover';

export type DatePickerPopoverProps = Pick<
  DayPickerSingleProps,
  'selected' | 'onSelect' | 'fromDate' | 'toDate' | 'required'
> &
  React.ComponentProps<typeof Popover>;

export function DatePickerPopover({
  children,
  onOpenChange,
  selected,
  onSelect,
  fromDate,
  toDate,
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
          fromDate={fromDate}
          toDate={toDate}
          required={required}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}

export type DatePickerRangePopoverProps = Pick<
  DayPickerRangeProps,
  'selected' | 'onSelect' | 'fromDate' | 'toDate'
> &
  React.ComponentProps<typeof Popover>;

export function DatePickerRangePopover({
  children,
  onOpenChange,
  selected,
  onSelect,
  fromDate,
  toDate,
  ...props
}: DatePickerRangePopoverProps) {
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
          mode="range"
          selected={selected}
          onSelect={onSelect}
          defaultMonth={selected?.to}
          fromDate={fromDate}
          toDate={toDate}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}

export function DatePickerButton({
  selected,
  ...props
}: { selected?: Date | DateRange } & React.ComponentProps<typeof Button>) {
  const text = useMemo(() => {
    if (selected) {
      if (selected instanceof Date) {
        return format(selected, 'yyyy/MM/dd');
      }
      return `${selected.from ? format(selected.from, 'yyyy/MM/dd') : '-'} to ${selected.to ? format(selected.to, 'yyyy/MM/dd') : '-'}`;
    }
    return 'Pick a date';
  }, [selected]);

  return (
    <Button type="button" variant="outline" {...props}>
      {text}
      <CalendarIcon className="ml-auto opacity-50" />
    </Button>
  );
}
