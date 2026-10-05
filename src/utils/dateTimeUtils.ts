/**
 * Utilities for Date and Time manipulation, parsing, formatting, and validation.
 */

/**
 * Parses a combined time string into separate startTime and endTime.
 * Examples:
 *  "10:00 AM - 04:00 PM" -> { startTime: "10:00 AM", endTime: "04:00 PM" }
 *  "10:00 AM" -> { startTime: "10:00 AM", endTime: "" }
 */
export function parseTimeRange(timeStr: string): { startTime: string; endTime: string } {
  if (!timeStr || typeof timeStr !== 'string') {
    return { startTime: '', endTime: '' };
  }

  const parts = timeStr.split(/\s*-\s*/);
  if (parts.length >= 2) {
    return {
      startTime: parts[0].trim(),
      endTime: parts[1].trim(),
    };
  }

  return {
    startTime: timeStr.trim(),
    endTime: '',
  };
}

/**
 * Combines startTime and endTime into a standardized interval string.
 */
export function formatTimeRange(startTime: string, endTime?: string): string {
  if (!startTime) return '';
  if (!endTime) return startTime.trim();
  return `${startTime.trim()} - ${endTime.trim()}`;
}

/**
 * Converts a time string (12-hour or 24-hour) into minutes from midnight (0 - 1440).
 */
export function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i);
  if (!match) return 0;

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3]?.toUpperCase();

  if (period === 'PM' && hours < 12) {
    hours += 12;
  } else if (period === 'AM' && hours === 12) {
    hours = 0;
  }

  return hours * 60 + minutes;
}

/**
 * Determines whether two time intervals overlap.
 */
export function timesOverlap(timeA: string, timeB: string): boolean {
  if (!timeA || !timeB) return false;
  if (timeA.trim().toLowerCase() === timeB.trim().toLowerCase()) return true;

  const rangeA = parseTimeRange(timeA);
  const rangeB = parseTimeRange(timeB);

  const startA = timeToMinutes(rangeA.startTime);
  let endA = rangeA.endTime ? timeToMinutes(rangeA.endTime) : startA + 120; // default 2 hours
  if (endA <= startA) endA += 1440; // overnight span

  const startB = timeToMinutes(rangeB.startTime);
  let endB = rangeB.endTime ? timeToMinutes(rangeB.endTime) : startB + 120;
  if (endB <= startB) endB += 1440;

  return startA < endB && endA > startB;
}

/**
 * Constructs a Date object combining date and start time.
 */
export function getStartDateTime(dateStr: string, timeStr?: string): Date {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return new Date();

  // Extract year, month, date parts safely
  const year = date.getUTCFullYear() || date.getFullYear();
  const month = date.getUTCMonth() !== undefined ? date.getUTCMonth() : date.getMonth();
  const day = date.getUTCDate() || date.getDate();

  const { startTime } = parseTimeRange(timeStr || '09:00 AM');
  const minutes = timeToMinutes(startTime);
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  return new Date(year, month, day, hours, mins, 0, 0);
}

/**
 * Checks if a given event date and time is in the past.
 */
export function isEventInPast(dateStr: string, timeStr?: string): boolean {
  const eventStart = getStartDateTime(dateStr, timeStr);
  return eventStart.getTime() < Date.now();
}

/**
 * Formats a date string nicely (e.g., "25 Nov 2026").
 */
export function formatDisplayDate(dateInput: string | Date): string {
  if (!dateInput) return '';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return String(dateInput);

  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}
