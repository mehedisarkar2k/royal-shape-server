export function isCurrentTimeGreater(givenTime: string, checkIn: Date): boolean {
  const [time, meridian] = givenTime.split(" ");
  const [givenHours, givenMinutes] = time.split(":").map(Number);

  // * convert given time to 24-hour format
  let givenHours24 = meridian === "PM" && givenHours !== 12 ? givenHours + 12 : givenHours;
  givenHours24 = meridian === "AM" && givenHours === 12 ? 0 : givenHours24;

  const givenDate = new Date();
  givenDate.setHours(givenHours24, givenMinutes, 0, 0);

  return checkIn.getTime() > givenDate.getTime();
}

export function isCurrentTimeLesser(givenTime: string, currentDateTime: Date): boolean {
  const [time, meridian] = givenTime.split(" ");
  const [givenHours, givenMinutes] = time.split(":").map(Number);

  // * convert given time to 24-hour format
  let givenHours24 = meridian === "PM" && givenHours !== 12 ? givenHours + 12 : givenHours;
  givenHours24 = meridian === "AM" && givenHours === 12 ? 0 : givenHours24;

  const givenDate = new Date();
  givenDate.setHours(givenHours24, givenMinutes, 0, 0);

  return currentDateTime.getTime() < givenDate.getTime();
}

/**
 * Checks if a given date string is valid and in yyyy-mm-dd format.
 * @param dateStr string - date in 'yyyy-mm-dd' format
 * @returns boolean - true if valid, false otherwise
 */
export function isValidDate(dateStr: string): boolean {
  // Check format strictly: 4-digit year, 2-digit month/day
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateStr)) return false;

  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  // Check that date components match (no overflow, e.g., 2025-02-30)
  return date.getUTCFullYear() === year && date.getUTCMonth() + 1 === month && date.getUTCDate() === day;
}

export function isValidTimeFormat(timeStr: string): boolean {
  const regex = /^(0?[1-9]|1[0-2]):[0-5][0-9]\s?(AM|PM|am|pm)$/;
  return regex.test(timeStr.trim());
}

export function parseDateTimeFromDateAndTimeStr(dateStr: string, timeStr: string): Date | null {
  // Validate time first (using our previous helper)
  const timeRegex = /^(0?[1-9]|1[0-2]):([0-5][0-9])\s?(AM|PM|am|pm)$/;
  const match = timeStr.trim().match(timeRegex);
  if (!match) return null;

  // Extract hour and minute
  let hour = parseInt(match[1], 10);
  const minute = parseInt(match[2], 10);
  const period = match[3].toUpperCase();

  // Convert to 24-hour format
  if (period === "PM" && hour !== 12) hour += 12;
  if (period === "AM" && hour === 12) hour = 0;

  // Construct ISO-like datetime string
  const dateTimeStr = `${dateStr}T${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}:00Z`;

  const dateObj = new Date(dateTimeStr);
  return isNaN(dateObj.getTime()) ? null : dateObj;
}

export function getTimeDifferenceInMinutes(start: string, end: string): number {
  const parseTime = (timeStr: string): number => {
    const [time, modifier] = timeStr.trim().split(" ");
    // eslint-disable-next-line prefer-const
    let [hours, minutes] = time.split(":").map(Number);

    if (modifier.toUpperCase() === "PM" && hours !== 12) {
      hours += 12;
    }
    if (modifier.toUpperCase() === "AM" && hours === 12) {
      hours = 0;
    }

    return hours * 60 + minutes;
  };

  const startMinutes = parseTime(start);
  const endMinutes = parseTime(end);

  const diff = endMinutes - startMinutes;
  if (diff < 0) {
    throw new Error("End time must be after start time");
  }

  return diff;
}
