import { extractDate } from '@/lib/utils';
import type { DateFilterValue } from '@/components/DateFilter';

/**
 * Filter a date value by a date filter value, which can be from a date, up to
 * a date, or between two dates.
 * @param value The date to filter.
 * @param filterValue The filter value
 * @returns The date passes the filter.
 */
export function filterByDate(value: Date, filterValue: DateFilterValue): boolean {
  if (filterValue) {
    if (filterValue.mode === 'from') {
      return value >= extractDate(filterValue.date);
    } else if (filterValue.mode === 'to') {
      return value <= extractDate(filterValue.date);
    } else if (filterValue.mode === 'range') {
      if (filterValue.from && filterValue.to) {
        return value >= extractDate(filterValue.from) && value <= extractDate(filterValue.to);
      }
    }
  }
  return true;
}
