import { format, isAfter, isBefore, parseISO, differenceInYears } from "date-fns";

/**
 * Format a date to a readable string
 * @param date - Date object or ISO string
 * @param formatStr - Format string (default: "PPP")
 * @returns Formatted date string
 */
export const formatDate = (date: Date | string, formatStr = "PPP"): string => {
  const dateObj = typeof date === "string" ? parseISO(date) : date;
  return format(dateObj, formatStr);
};

/**
 * Format a date to a readable time string
 * @param date - Date object or ISO string
 * @returns Formatted time string (e.g., "10:30 AM")
 */
export const formatTime = (date: Date | string): string => {
  const dateObj = typeof date === "string" ? parseISO(date) : date;
  return format(dateObj, "p");
};

/**
 * Calculate age from date of birth
 * @param dob - Date of birth
 * @returns Age in years
 */
export const calculateAge = (dob: Date | string): number => {
  const dateObj = typeof dob === "string" ? parseISO(dob) : dob;
  return differenceInYears(new Date(), dateObj);
};

/**
 * Check if first date is after second date
 */
export const isDateAfter = (date1: Date | string, date2: Date | string): boolean => {
  const d1 = typeof date1 === "string" ? parseISO(date1) : date1;
  const d2 = typeof date2 === "string" ? parseISO(date2) : date2;
  return isAfter(d1, d2);
};

/**
 * Check if first date is before second date
 */
export const isDateBefore = (date1: Date | string, date2: Date | string): boolean => {
  const d1 = typeof date1 === "string" ? parseISO(date1) : date1;
  const d2 = typeof date2 === "string" ? parseISO(date2) : date2;
  return isBefore(d1, d2);
};
