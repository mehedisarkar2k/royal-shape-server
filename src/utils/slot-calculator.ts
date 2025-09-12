interface TimeSlot {
  startTime: string;
  endTime: string;
}

interface BookingInfo {
  bookingDate: Date;
  serviceIds?: string[] | null;
  comboId?: string | null;
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
  const lowerDuration = duration.toLowerCase();

  if (lowerDuration.includes("hour")) {
    const hours = parseFloat(lowerDuration.match(/[\d.]+/)?.[0] || "1");
    return hours * 60;
  } else if (lowerDuration.includes("minute")) {
    const minutes = parseFloat(lowerDuration.match(/[\d.]+/)?.[0] || "30");
    return minutes;
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
  const totalSlotDuration = Math.max(serviceDuration, slotDuration);

  // Convert working hours to minutes
  const startMinutes = timeToMinutes(workingHours.open);
  const endMinutes = timeToMinutes(workingHours.close);

  // Create array of booked time slots
  const bookedSlots: { start: number; end: number }[] = existingBookings.map((booking) => {
    const bookingTime = new Date(booking.bookingDate);
    const bookingStartMinutes = bookingTime.getHours() * 60 + bookingTime.getMinutes();

    // For now, assume each booking takes the service duration
    // In a real scenario, you'd calculate this based on the actual services booked
    const bookingDuration = serviceDuration || 60; // Default to 1 hour if no services

    return {
      start: bookingStartMinutes,
      end: bookingStartMinutes + bookingDuration
    };
  });

  // Generate all possible slots
  const availableSlots: TimeSlot[] = [];

  for (let currentTime = startMinutes; currentTime + totalSlotDuration <= endMinutes; currentTime += slotDuration) {
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
