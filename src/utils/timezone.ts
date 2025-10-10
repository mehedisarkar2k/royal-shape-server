/**
 * Get current date & time in Australian timezone
 * @param timezone default is 'Australia/Sydney'
 */
export function getCurrentAustralianDateTimeInLocalString(timezone: string = "Australia/Sydney"): string {
  const now = new Date();
  return now.toLocaleString("en-AU", { timeZone: timezone });
}

export function getCurrentAustralianDateTime(timezone: string = "Australia/Sydney"): Date {
  const now = new Date();
  const localeString = now.toLocaleString("en-AU", { timeZone: timezone });
  return new Date(localeString);
}

/**
 * Convert a given date to Australian timezone
 * @param date Date or date string (e.g. "2025-10-10T12:00:00Z")
 * @param timezone default is 'Australia/Sydney'
 */
export function getAustralianDateTimeInLocalString(date: Date | string, timezone: string = "Australia/Sydney"): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return dateObj.toLocaleString("en-AU", { timeZone: timezone });
}

export function getAustralianDateTime(date: Date | string, timezone: string = "Australia/Sydney"): Date {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  const localeString = dateObj.toLocaleString("en-AU", { timeZone: timezone });
  return new Date(localeString);
}
