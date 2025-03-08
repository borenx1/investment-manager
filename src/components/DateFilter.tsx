'use client';

import { useCallback, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

type DateFilterMode = 'from' | 'to' | 'range';

export type DateFilterValue =
  | { mode: 'from' | 'to'; date: Date }
  | { mode: 'range'; from: Date | undefined; to?: Date | undefined }
  | undefined;

export default function DateFilter({
  name,
  value,
  onChange,
}: {
  name: string;
  value?: DateFilterValue;
  onChange?: (value: DateFilterValue) => void;
}) {
  const [mode, setMode] = useState<DateFilterMode>('from');
  const singleValue = useMemo(() => {
    if (value && (value.mode === 'from' || value.mode === 'to')) {
      return value.date;
    }
    return undefined;
  }, [value]);
  const rangeValue = useMemo(() => {
    if (value && value.mode === 'range') {
      return { from: value.from, to: value.to };
    }
    return undefined;
  }, [value]);
  const valueText = useMemo(() => {
    if (value) {
      if (value.mode === 'from') {
        return `From ${format(value.date, 'yyyy/MM/dd')}`;
      }
      if (value.mode === 'to') {
        return `Up to ${format(value.date, 'yyyy/MM/dd')}`;
      }
      if (value.mode === 'range') {
        return `From ${value.from ? format(value.from, 'yyyy/MM/dd') : '-'} to ${value.to ? format(value.to, 'yyyy/MM/dd') : '-'}`;
      }
    }
    return '';
  }, [value]);

  const handleModeChange = useCallback(
    (newMode: string) => {
      const oldMode = mode;
      if (newMode === '' || newMode === oldMode) {
        // Do nothing if the mode does not change.
      } else if (newMode === 'from' || newMode === 'to' || newMode === 'range') {
        setMode(newMode);
        if (onChange) {
          if (newMode === 'range') {
            // from/to -> range.
            if (singleValue === undefined) {
              onChange(undefined);
            } else {
              onChange({ mode: 'range', from: singleValue, to: undefined });
            }
          } else if (oldMode === 'range') {
            // range -> from/to.
            if (rangeValue === undefined) {
              onChange(undefined);
            } else if (newMode === 'from') {
              // range -> from.
              const newSingleValue = rangeValue.from ?? rangeValue.to;
              if (newSingleValue !== undefined) {
                onChange({ mode: 'from', date: newSingleValue });
              } else {
                onChange(undefined);
              }
            } else if (newMode === 'to') {
              // range -> to.
              const newSingleValue = rangeValue.to ?? rangeValue.from;
              if (newSingleValue !== undefined) {
                onChange({ mode: 'to', date: newSingleValue });
              } else {
                onChange(undefined);
              }
            }
          } else {
            // from/to -> from/to.
            if (singleValue !== undefined) {
              onChange({ mode: newMode, date: singleValue });
            } else {
              onChange(undefined);
            }
          }
        }
      } else {
        // Unrecognized mode. Should not be reachable.
        setMode('from');
        onChange?.(undefined);
      }
    },
    [mode, onChange, singleValue, rangeValue],
  );

  return (
    <Popover modal={false}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="border-dashed">
          <CalendarIcon />
          {name}
          {value && (
            <>
              <Separator orientation="vertical" />
              <Badge variant="secondary" className="font-normal">
                {valueText}
              </Badge>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <div className="p-1">
          <ToggleGroup
            type="single"
            value={mode}
            onValueChange={handleModeChange}
            className="w-full"
          >
            <ToggleGroupItem value="from" aria-label="Toggle from">
              From
            </ToggleGroupItem>
            <ToggleGroupItem value="to" aria-label="Toggle up to">
              Up to
            </ToggleGroupItem>
            <ToggleGroupItem value="range" aria-label="Toggle range">
              Range
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
        <Separator />
        {(mode === 'from' || mode === 'to') && (
          <Calendar
            mode="single"
            selected={singleValue}
            onSelect={(day) => {
              if (onChange && (mode === 'from' || mode === 'to')) {
                onChange(day ? { mode, date: day } : undefined);
              }
            }}
            initialFocus
          />
        )}
        {mode === 'range' && (
          <Calendar
            mode="range"
            selected={rangeValue}
            onSelect={(range) => {
              if (onChange && mode === 'range') {
                onChange(range ? { mode, from: range.from, to: range.to } : undefined);
              }
            }}
            initialFocus
          />
        )}
        {value && (
          <>
            <Separator />
            <div className="p-1">
              <Button
                variant="ghost"
                className="w-full rounded-none"
                onClick={() => onChange?.(undefined)}
              >
                Clear filters
              </Button>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
