import { format, formatDistanceToNow, isToday, isYesterday, parseISO } from "date-fns";

/**
 * Format a date string to a readable format
 * @param dateString - ISO date string
 * @param formatString - Optional format string (default: "MMM dd, yyyy 'at' h:mm a")
 * @returns Formatted date string
 */
export const formatDate = (
  dateString: string,
  formatString: string = "MMM dd, yyyy 'at' h:mm a"
): string => {
  try {
    const date = parseISO(dateString);
    return format(date, formatString);
  } catch (error) {
    return dateString;
  }
};

/**
 * Format a date to a relative time string (e.g., "2 hours ago", "3 days ago")
 * @param dateString - ISO date string
 * @returns Relative time string
 */
export const formatRelativeTime = (dateString: string): string => {
  try {
    const date = parseISO(dateString);
    return formatDistanceToNow(date, { addSuffix: true });
  } catch (error) {
    return dateString;
  }
};

/**
 * Format a date to a short relative time (e.g., "2h ago", "3d ago", "Just now")
 * Similar to social media time displays
 * @param dateString - ISO date string
 * @returns Short relative time string
 */
export const formatShortRelativeTime = (dateString: string): string => {
  try {
    const date = parseISO(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    // Less than 1 minute
    if (diffInSeconds < 60) {
      return "Just now";
    }

    // Less than 1 hour
    if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}m ago`;
    }

    // Less than 24 hours
    if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}h ago`;
    }

    // Less than 7 days
    if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days}d ago`;
    }

    // More than 7 days - show date
    if (isToday(date)) {
      return "Today";
    }
    if (isYesterday(date)) {
      return "Yesterday";
    }
    return format(date, "MMM dd, yyyy");
  } catch (error) {
    return dateString;
  }
};

/**
 * Format a date to a full date and time string
 * @param dateString - ISO date string
 * @returns Full date and time string
 */
export const formatDateTime = (dateString: string): string => {
  return formatDate(dateString, "MMM dd, yyyy 'at' h:mm a"); // e.g., "Apr 29, 2021 at 9:00 AM"
};

/**
 * Format a date to a date-only string
 * @param dateString - ISO date string
 * @returns Date-only string
 */
export const formatDateOnly = (dateString: string): string => {
  return formatDate(dateString, "MMM dd, yyyy");
};

/**
 * Format a date to a time-only string
 * @param dateString - ISO date string
 * @returns Time-only string
 */
export const formatTimeOnly = (dateString: string): string => {
  return formatDate(dateString, "h:mm a");
};

