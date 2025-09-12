import { Booking, BookingModel } from "../model";

export function createBooking(data: Booking) {
  return BookingModel.create(data);
}

export function findBookingsByBranchAndDate(branchId: string, date: Date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  return BookingModel.find({
    branchId,
    bookingDate: {
      $gte: startOfDay,
      $lte: endOfDay
    }
  });
}
