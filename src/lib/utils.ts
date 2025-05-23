import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import {
  addDays,
  addMonths,
  format,
  isFirstDayOfMonth,
  isLastDayOfMonth,
  lastDayOfMonth,
} from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Sum two floating point numbers accurately. Requires a precision.
 * @param num1 The first number to sum.
 * @param num2 The second number to sum.
 * @param decimalPlaces The number of decimal places to round to.
 * @returns The sum of the two numbers.
 */
export function sumFloats(num1: number, num2: number, decimalPlaces: number) {
  return parseFloat(Number(num1 + num2).toFixed(decimalPlaces));
}

/**
 * Round a number to a fixed number of decimal places.
 * @param value The number to round.
 * @param decimalPlaces The number of decimal places to round to.
 * @returns The rounded number.
 */
export function roundNumber(value: number, decimalPlaces: number) {
  return Number(Number(value).toFixed(decimalPlaces));
}

/**
 * Format a number to a string with a fixed number of decimal places.
 * @param value The number to format.
 * @param decimalPlaces The number of decimal places.
 * @param trailingZeros Whether to include trailing zeros. Defaults to `true`.
 * @param options Additional number format options.
 * @returns The formatted number.
 */
export function formatDecimalPlaces(
  value: number,
  decimalPlaces: number,
  {
    trailingZeros = true,
    ...options
  }: { trailingZeros?: boolean } & Omit<
    Intl.NumberFormatOptions,
    'style' | 'minimumFractionDigits' | 'maximumFractionDigits' | 'trailingZeroDisplay'
  > = {},
) {
  return new Intl.NumberFormat(undefined, {
    style: 'decimal',
    minimumFractionDigits: trailingZeros ? decimalPlaces : 0,
    maximumFractionDigits: decimalPlaces,
    ...options,
  }).format(value);
}

/**
 * Format a number as a currency with a fixed number of decimal places.
 * @param value The number to format.
 * @param decimalPlaces The number of decimal places.
 * @param symbol The currency symbol.
 * @returns The formatted currency string.
 */
export function formatCurrency(value: number, decimalPlaces: number, symbol?: string | null) {
  if (!symbol) {
    return formatDecimalPlaces(value, decimalPlaces);
  }
  const sign = value < 0 ? '-' : '';
  return `${sign}${symbol}${formatDecimalPlaces(Math.abs(value), decimalPlaces)}`;
}

/**
 * Get the current date at 00:00:00 time.
 * @returns The current date.
 */
export function getCurrentDate() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

/**
 * Extract the date from a date object. The time is set to 00:00:00.
 * @param date The date to extract.
 * @returns The new date.
 */
export function extractDate(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/**
 * Convert a date to a UTC date in the local timezone. The time is set to
 * 00:00:00.
 * @param date The date to convert.
 * @returns The new date.
 */
export function convertUTCDate(date: Date) {
  return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

/**
 * Get a list of dates between two dates based on a selection type.
 * @param fromDate The start date.
 * @param toDate The end date.
 * @param selection The selection of dates to get.
 * @returns The list of dates in YYYY-MM-DD format.
 */
export function getDateList(
  fromDate: Date,
  toDate: Date,
  selection: 'month-start' | 'month-end' | 'all',
) {
  fromDate = extractDate(fromDate);
  toDate = extractDate(toDate);
  if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
    return [];
  }

  const dates: string[] = [];
  let currentDate = fromDate;
  if (selection === 'all') {
    while (currentDate <= toDate) {
      dates.push(format(currentDate, 'yyyy-MM-dd'));
      currentDate = addDays(currentDate, 1);
    }
  } else if (selection === 'month-start') {
    currentDate = isFirstDayOfMonth(fromDate)
      ? fromDate
      : new Date(fromDate.getFullYear(), fromDate.getMonth() + 1, 1);
    while (currentDate <= toDate) {
      dates.push(format(currentDate, 'yyyy-MM-dd'));
      currentDate = addMonths(currentDate, 1);
    }
  } else if (selection === 'month-end') {
    currentDate = isLastDayOfMonth(fromDate) ? fromDate : lastDayOfMonth(fromDate);
    while (currentDate <= toDate) {
      dates.push(format(currentDate, 'yyyy-MM-dd'));
      currentDate = lastDayOfMonth(addMonths(currentDate, 1));
    }
  }
  return dates;
}
