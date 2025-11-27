// FR-002: Utility functions for date formatting and month generation

import { format, parse, eachMonthOfInterval } from 'date-fns';

/**
 * Format a YYYY-MM string to display format
 */
export const formatMonth = (month: string): string => {
  try {
    const date = parse(month + '-01', 'yyyy-MM-dd', new Date());
    return format(date, 'MMMM yyyy');
  } catch {
    return month;
  }
};

/**
 * Generate array of months between start and end dates (inclusive)
 */
export const generateMonthRange = (
  startDate: string,
  endDate: string
): string[] => {
  try {
    const start = parse(startDate + '-01', 'yyyy-MM-dd', new Date());
    const end = parse(endDate + '-01', 'yyyy-MM-dd', new Date());

    const months = eachMonthOfInterval({ start, end });
    return months.map((date) => format(date, 'yyyy-MM'));
  } catch {
    return [];
  }
};

/**
 * Get current month in YYYY-MM format
 */
export const getCurrentMonth = (): string => {
  return format(new Date(), 'yyyy-MM');
};

/**
 * Get previous month in YYYY-MM format
 */
export const getPreviousMonth = (month: string): string | null => {
  try {
    const date = parse(month + '-01', 'yyyy-MM-dd', new Date());
    date.setMonth(date.getMonth() - 1);
    return format(date, 'yyyy-MM');
  } catch {
    return null;
  }
};

/**
 * Format file name with timestamp
 */
export const formatFileName = (prefix: string, extension: string): string => {
  const timestamp = format(new Date(), 'yyyy-MM-dd-HHmmss');
  return `${prefix}-${timestamp}.${extension}`;
};

/**
 * Truncate text to specified length with ellipsis
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
};

/**
 * Format number with comma separators for thousands
 */
export const formatNumber = (value: number | string): string => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '0';
  return num.toLocaleString('en-US', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  });
};

/**
 * Parse comma-formatted number string to number
 */
export const parseFormattedNumber = (value: string): number => {
  const cleaned = value.replace(/,/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
};

