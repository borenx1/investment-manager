import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  cn,
  sumFloats,
  roundNumber,
  formatDecimalPlaces,
  formatCurrency,
  getCurrentDate,
  extractDate,
  convertUTCDate,
  getDateList,
} from '../utils';

describe('cn', () => {
  it('should merge class names correctly', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
    expect(cn('foo', { bar: true })).toBe('foo bar');
    expect(cn('foo', { bar: false })).toBe('foo');
    expect(cn('foo', ['bar', 'baz'])).toBe('foo bar baz');
  });
  it('should handle tailwind utility conflicts', () => {
    expect(cn('px-4 py-2', 'p-4')).toBe('p-4');
    expect(cn('text-sm', 'text-lg')).toBe('text-lg');
  });
});

describe('sumFloats', () => {
  it('should sum two floats with decimal places', () => {
    expect(sumFloats(0.1, 0.2, 1)).toBe(0.3);
    expect(sumFloats(0.01, 0.02, 2)).toBe(0.03);
    expect(sumFloats(1.234, 5.678, 2)).toBe(6.91);
  });
  it('should handle negative numbers', () => {
    expect(sumFloats(-0.1, 0.2, 1)).toBe(0.1);
    expect(sumFloats(0.1, -0.2, 1)).toBe(-0.1);
    expect(sumFloats(-0.1, -0.2, 1)).toBe(-0.3);
  });
  it('should round to the specified decimal places', () => {
    expect(sumFloats(0.125, 0.126, 2)).toBe(0.25);
    expect(sumFloats(0.125, 0.126, 3)).toBe(0.251);
  });
});

describe('roundNumber', () => {
  it('should round to specified decimal places', () => {
    expect(roundNumber(3.14159, 2)).toBe(3.14);
    expect(roundNumber(3.14159, 4)).toBe(3.1416);
    expect(roundNumber(3.14159, 0)).toBe(3);
  });
  it('should handle rounding for negative numbers', () => {
    expect(roundNumber(-3.14159, 2)).toBe(-3.14);
    expect(roundNumber(-3.14159, 4)).toBe(-3.1416);
  });
  it('should follow standard IEEE 754 rounding rules', () => {
    expect(roundNumber(3.145, 2)).toBe(3.15);
    expect(roundNumber(3.155, 2)).toBe(3.15);
  });
});

describe('formatDecimalPlaces', () => {
  it('should format with correct decimal places', () => {
    expect(formatDecimalPlaces(3.14159, 2)).toBe('3.14');
    expect(formatDecimalPlaces(3.1, 2)).toBe('3.10');
    expect(formatDecimalPlaces(3, 2)).toBe('3.00');
  });
  it('should handle the trailingZeros option', () => {
    expect(formatDecimalPlaces(3.14, 2, { trailingZeros: true })).toBe('3.14');
    expect(formatDecimalPlaces(3.1, 2, { trailingZeros: true })).toBe('3.10');
    expect(formatDecimalPlaces(3.1, 2, { trailingZeros: false })).toBe('3.1');
    expect(formatDecimalPlaces(3.0, 2, { trailingZeros: false })).toBe('3');
  });
  it('should handle other Intl.NumberFormat options', () => {
    expect(formatDecimalPlaces(3.14, 2, { useGrouping: true })).toBe('3.14');
    expect(formatDecimalPlaces(1234.56, 2, { useGrouping: true })).toBe('1,234.56');
    expect(formatDecimalPlaces(1234.56, 2, { useGrouping: false })).toBe('1234.56');
  });
});

describe('formatCurrency', () => {
  it('should format with currency symbol', () => {
    expect(formatCurrency(3.14159, 2, '$')).toBe('$3.14');
    expect(formatCurrency(3.1, 2, '€')).toBe('€3.10');
    expect(formatCurrency(3, 2, '£')).toBe('£3.00');
  });
  it('should handle negative values', () => {
    expect(formatCurrency(-3.14, 2, '$')).toBe('-$3.14');
    expect(formatCurrency(-1000, 2, '€')).toBe('-€1,000.00');
  });
  it('should format without symbol when no symbol is provided', () => {
    expect(formatCurrency(3.14159, 2)).toBe('3.14');
    expect(formatCurrency(3.14159, 2, null)).toBe('3.14');
    expect(formatCurrency(3.14159, 2, '')).toBe('3.14');
  });
});

describe('getCurrentDate', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2023, 5, 15, 12, 30, 45)); // 15 June 2023, 12:30:45
  });
  afterEach(() => {
    vi.useRealTimers();
  });
  it('should return the current date with time set to 00:00:00', () => {
    const result = getCurrentDate();
    expect(result.getFullYear()).toBe(2023);
    expect(result.getMonth()).toBe(5);
    expect(result.getDate()).toBe(15);
    expect(result.getHours()).toBe(0);
    expect(result.getMinutes()).toBe(0);
    expect(result.getSeconds()).toBe(0);
    expect(result.getMilliseconds()).toBe(0);
  });
});

describe('extractDate', () => {
  it('should extract date part setting time to 00:00:00', () => {
    const date = new Date(2023, 5, 15, 12, 30, 45);
    const result = extractDate(date);
    expect(result.getFullYear()).toBe(2023);
    expect(result.getMonth()).toBe(5);
    expect(result.getDate()).toBe(15);
    expect(result.getHours()).toBe(0);
    expect(result.getMinutes()).toBe(0);
    expect(result.getSeconds()).toBe(0);
    expect(result.getMilliseconds()).toBe(0);
  });
});

describe('convertUTCDate', () => {
  it('should convert UTC date to local date with time set to 00:00:00', () => {
    const utcDate = new Date(Date.UTC(2023, 5, 15, 12, 30, 45));
    const result = convertUTCDate(utcDate);
    expect(result.getFullYear()).toBe(2023);
    expect(result.getMonth()).toBe(5);
    expect(result.getDate()).toBe(15);
    expect(result.getHours()).toBe(0);
    expect(result.getMinutes()).toBe(0);
    expect(result.getSeconds()).toBe(0);
    expect(result.getMilliseconds()).toBe(0);
  });
});

describe('getDateList', () => {
  it('should return an empty array for invalid dates', () => {
    const fromDate = new Date('invalid date');
    const toDate = new Date(2023, 5, 15);
    expect(getDateList(fromDate, toDate, 'all')).toEqual([]);

    const fromDate2 = new Date(2023, 5, 15);
    const toDate2 = new Date('invalid date');
    expect(getDateList(fromDate2, toDate2, 'all')).toEqual([]);
  });
  it('should return an empty array if no dates are found', () => {
    const fromDateAll = new Date(2023, 0, 2);
    const toDateAll = new Date(2023, 0, 1);
    expect(getDateList(fromDateAll, toDateAll, 'all')).toEqual([]);

    const fromDateMonthStart = new Date(2023, 0, 2);
    const toDateMonthStart = new Date(2023, 0, 31);
    expect(getDateList(fromDateMonthStart, toDateMonthStart, 'month-start')).toEqual([]);

    const fromDateMonthEnd = new Date(2023, 0, 1);
    const toDateMonthEnd = new Date(2023, 0, 30);
    expect(getDateList(fromDateMonthEnd, toDateMonthEnd, 'month-end')).toEqual([]);
  });
  it('should return all dates between from and to dates when selection is "all"', () => {
    const fromDate = new Date(2023, 0, 1); // 1 Jan 2023
    const toDate = new Date(2023, 0, 5); // 5 Jan 2023
    const result = getDateList(fromDate, toDate, 'all');
    expect(result).toEqual(['2023-01-01', '2023-01-02', '2023-01-03', '2023-01-04', '2023-01-05']);
    expect(getDateList(new Date(2023, 0, 1), new Date(2023, 0, 1), 'all')).toEqual(['2023-01-01']);
  });
  it('should return first day of each month when selection is "month-start"', () => {
    const fromDate = new Date(2023, 0, 15); // 15 Jan 2023
    const toDate = new Date(2023, 3, 15); // 15 Apr 2023
    const result = getDateList(fromDate, toDate, 'month-start');
    expect(result).toEqual(['2023-02-01', '2023-03-01', '2023-04-01']);
    expect(getDateList(new Date(2023, 0, 31), new Date(2023, 1, 1), 'month-start')).toEqual([
      '2023-02-01',
    ]);
  });
  it('should include from date if it is first day of month with "month-start"', () => {
    const fromDate = new Date(2023, 0, 1); // 1 Jan 2023
    const toDate = new Date(2023, 2, 15); // 15 Mar 2023
    const result = getDateList(fromDate, toDate, 'month-start');
    expect(result).toEqual(['2023-01-01', '2023-02-01', '2023-03-01']);
    expect(getDateList(new Date(2023, 0, 1), new Date(2023, 0, 1), 'month-start')).toEqual([
      '2023-01-01',
    ]);
  });
  it('should return last day of each month when selection is "month-end"', () => {
    const fromDate = new Date(2023, 0, 15); // 15 Jan 2023
    const toDate = new Date(2023, 3, 15); // 15 Apr 2023
    const result = getDateList(fromDate, toDate, 'month-end');
    expect(result).toEqual(['2023-01-31', '2023-02-28', '2023-03-31']);
    expect(getDateList(new Date(2023, 0, 1), new Date(2023, 0, 31), 'month-end')).toEqual([
      '2023-01-31',
    ]);
  });
  it('should include from date if it is last day of month with "month-end"', () => {
    const fromDate = new Date(2023, 0, 31); // 31 Jan 2023
    const toDate = new Date(2023, 2, 15); // 15 Mar 2023
    const result = getDateList(fromDate, toDate, 'month-end');
    expect(result).toEqual(['2023-01-31', '2023-02-28']);
    expect(getDateList(new Date(2023, 0, 31), new Date(2023, 0, 31), 'month-end')).toEqual([
      '2023-01-31',
    ]);
  });
  it('should correctly handle leap years for month-end', () => {
    const fromDate = new Date(2024, 1, 15); // 15 Feb 2024 (leap year)
    const toDate = new Date(2024, 2, 15); // 15 Mar 2024
    const result = getDateList(fromDate, toDate, 'month-end');
    expect(result).toEqual(['2024-02-29']);
  });
});
