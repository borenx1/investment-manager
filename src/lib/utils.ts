import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a number to a string with a fixed number of decimal places.
 * @param value The number to format.
 * @param decimalPlaces The number of decimal places.
 * @returns The formatted number.
 */
export function formatDecimalPlaces(value: number, decimalPlaces: number) {
  return new Intl.NumberFormat(undefined, {
    style: 'decimal',
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  }).format(value);
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
 * Convert a date to a UTC date in the local timezone. The time is set to
 * 00:00:00.
 * @param date The date to convert.
 * @returns The new date.
 */
export function convertUTCDate(date: Date) {
  return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}
