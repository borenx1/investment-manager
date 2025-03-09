'use client';

import { useCallback } from 'react';
import type { LucideIcon } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';

export default function SelectFilter<
  T extends { value: string; label: string; icon?: LucideIcon },
>({
  name,
  icon: Icon,
  options,
  values,
  onChange,
}: {
  name: string;
  icon?: LucideIcon;
  options?: Readonly<T[]>;
  values?: Readonly<T[]>;
  onChange?: (values: T[]) => void;
}) {
  const toggleValue = useCallback(
    (value: T) => {
      if (!values?.length) {
        return [value];
      }
      if (values.some((v) => v.value === value.value)) {
        return values.filter((v) => v.value !== value.value);
      }
      if (!options?.some((opt) => opt.value === value.value)) {
        return [...values];
      }
      // Return the values in the same order as options.
      const newValues = [...values, value];
      return newValues.sort((a, b) => {
        const indexA = options.findIndex((v) => v.value === a.value);
        const indexB = options.findIndex((v) => v.value === b.value);
        return indexA - indexB;
      });
    },
    [values, options],
  );

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="border-dashed">
          {Icon && <Icon />}
          {name}
          {!!values?.length && (
            <>
              <Separator orientation="vertical" />
              {values.length < 3 ? (
                values.map((value) => (
                  <Badge key={value.value} variant="secondary" className="font-normal">
                    {value.label}
                  </Badge>
                ))
              ) : (
                <Badge variant="secondary" className="font-normal">
                  {values.length} selected
                </Badge>
              )}
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      {(!!options?.length || !!values?.length) && (
        <DropdownMenuContent align="start">
          {options?.map((opt) => (
            <DropdownMenuItem
              key={opt.value}
              onClick={(e) => {
                e.preventDefault();
                if (onChange) {
                  onChange(toggleValue(opt));
                }
              }}
            >
              <Checkbox checked={values?.some((value) => value.value === opt.value) ?? false} />
              {opt.icon && <opt.icon className="text-muted-foreground" />}
              {opt.label}
            </DropdownMenuItem>
          ))}
          {!!values?.length && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="justify-center" onClick={() => onChange?.([])}>
                Clear filters
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      )}
    </DropdownMenu>
  );
}
