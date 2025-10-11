import { getTimeDifferenceInMinutes, parseDateTimeFromDateAndTimeStr } from "./datetime-helper";

interface TimeSlot {
  startTime: string;
  endTime: string;
}

interface BookingInfo {
  bookingDate: Date;
  serviceIds?: string[] | null;
  comboId?: string | null;
  startTime: string;
  endTime: string;
}

interface ServiceInfo {
  duration: string;
}

interface WorkingHours {
  open: string;
  close: string;
}

/**
 * Parse duration string (e.g., "30 minutes", "1 hour", "1.5 hours") to minutes
 */
function parseDurationToMinutes(duration: string): number {
  if (!duration) return 30; // Default to 30 minutes if no duration provided

  // Check if the format is hh:mm:ss
  const parts = duration.split(":");

  if (parts.length === 3) {
    // hh:mm:ss format
    const hours = parseInt(parts[0], 10) || 0;
    const minutes = parseInt(parts[1], 10) || 0;
    const seconds = parseInt(parts[2], 10) || 0;

    return hours * 60 + minutes + Math.ceil(seconds / 60);
  } else if (parts.length === 2) {
    // hh:mm format
    const hours = parseInt(parts[0], 10) || 0;
    const minutes = parseInt(parts[1], 10) || 0;

    return hours * 60 + minutes;
  }

  // Default to 30 minutes if duration format is not recognized
  return 30;
}

/**
 * Convert time string (e.g., "09:00") to minutes from midnight
 */
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

/**
 * Convert minutes from midnight back to time string
 */
function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
}

/**
 * Format time for display (e.g., "09:00" -> "09:00 AM")
 */
function formatTimeForDisplay(time: string): string {
  const [hours, minutes] = time.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  return `${displayHours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")} ${period}`;
}

/**
 * Calculate total service duration in minutes
 */
function calculateTotalServiceDuration(services: ServiceInfo[]): number {
  return services.reduce((total, service) => {
    return total + parseDurationToMinutes(service.duration);
  }, 0);
}

/**
 * Generate available time slots for a given day
 */
export function calculateAvailableSlots(
  workingHours: WorkingHours,
  existingBookings: BookingInfo[],
  services: ServiceInfo[],
  slotDuration: number = 30 // Default slot duration in minutes
): { morning: TimeSlot[]; afternoon: TimeSlot[]; evening: TimeSlot[] } {
  const serviceDuration = calculateTotalServiceDuration(services);
  // const totalSlotDuration = Math.max(serviceDuration, slotDuration);
  const totalSlotDuration = serviceDuration === 0 ? slotDuration : serviceDuration;

  // Convert working hours to minutes
  const startMinutes = timeToMinutes(workingHours.open);
  const endMinutes = timeToMinutes(workingHours.close);

  // Create array of booked time slots
  const bookedSlots: { start: number; end: number }[] = existingBookings.map((booking) => {
    const bookingTime = new Date(booking.bookingDate);
    // console.log("Booking time:", bookingTime);
    // console.log("Booking time (hours):", bookingTime.getUTCHours());
    // console.log("Booking time (minutes):", bookingTime.getUTCMinutes());
    const bookingStartMinutes = bookingTime.getUTCHours() * 60 + bookingTime.getUTCMinutes();
    // console.log("Booking start minutes:", bookingStartMinutes);

    const bookingDuration = getTimeDifferenceInMinutes(booking.startTime, booking.endTime);
    // console.log("Booking duration:", bookingDuration);

    return {
      start: bookingStartMinutes,
      end: bookingStartMinutes + bookingDuration
    };
  });

  // Generate all possible slots
  const availableSlots: TimeSlot[] = [];

  for (
    let currentTime = startMinutes;
    currentTime + totalSlotDuration <= endMinutes;
    currentTime += totalSlotDuration
  ) {
    const slotEnd = currentTime + totalSlotDuration;

    // Check if this slot conflicts with any existing booking
    const hasConflict = bookedSlots.some((booked) => {
      return currentTime < booked.end && slotEnd > booked.start;
    });

    if (!hasConflict) {
      availableSlots.push({
        startTime: formatTimeForDisplay(minutesToTime(currentTime)),
        endTime: formatTimeForDisplay(minutesToTime(slotEnd))
      });
    }
  }

  // Categorize slots into morning, afternoon, and evening
  const morning: TimeSlot[] = [];
  const afternoon: TimeSlot[] = [];
  const evening: TimeSlot[] = [];

  availableSlots.forEach((slot) => {
    const startTime = slot.startTime;
    const hour = parseInt(startTime.split(":")[0]);
    const isPM = startTime.includes("PM");
    const hour24 = isPM && hour !== 12 ? hour + 12 : !isPM && hour === 12 ? 0 : hour;

    if (hour24 < 12) {
      morning.push(slot);
    } else if (hour24 < 17) {
      afternoon.push(slot);
    } else {
      evening.push(slot);
    }
  });

  return { morning, afternoon, evening };
}

/**
 * Check if a requested date and time slot is available
 */
export function isSlotAvailable(
  requestDate: string, // "yyyy-mm-dd"
  startTime: string, // "h:mm a" e.g. "9:00 AM"
  endTime: string, // "h:mm a" e.g. "10:30 AM"
  existingBookings: BookingInfo[]
): boolean {
  // Convert requestDate + startTime / endTime into Date objects
  const requestStartDate = parseDateTimeFromDateAndTimeStr(requestDate, startTime);
  const requestEndDate = parseDateTimeFromDateAndTimeStr(requestDate, endTime);
  if (!requestStartDate || !requestEndDate) return false;

  // Check each booking for conflicts
  for (const booking of existingBookings) {
    const bookingDate = new Date(booking.bookingDate);
    const bookingDateStr = bookingDate.toISOString().split("T")[0];

    if (bookingDateStr !== requestDate) continue; // Skip other dates

    const bookingStartDate = parseDateTimeFromDateAndTimeStr(bookingDateStr, booking.startTime); // booking.startTime = "HH:mm"
    const bookingEndDate = parseDateTimeFromDateAndTimeStr(bookingDateStr, booking.endTime);

    if (!bookingStartDate || !bookingEndDate) continue;

    const isOverlap = requestStartDate < bookingEndDate && requestEndDate > bookingStartDate;

    if (isOverlap) return false;
  }

  return true;
}
