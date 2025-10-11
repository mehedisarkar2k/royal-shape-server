import { Types } from "mongoose";
import { Booking, BookingModel } from "../model";

export function createBooking(data: Booking) {
  return BookingModel.create(data);
}

export function findBookingsByBranchAndDate(branchId: string, date: Date) {
  const startOfDay = new Date(date);
  startOfDay.setUTCHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setUTCHours(23, 59, 59, 999);

  return BookingModel.find({
    branchId,
    bookingDate: {
      $gte: startOfDay,
      $lte: endOfDay
    }
  });
}

export function findBookingById(bookingId: string) {
  return BookingModel.findById(bookingId);
}

export function findAllBookingsPaginated(page: number, limit: number) {
  const skip = (page - 1) * limit;
  return BookingModel.find().skip(skip).limit(limit).sort({ createdAt: -1 }).lean();
}

export function countAllBookings() {
  return BookingModel.countDocuments({});
}

// group by status and count and return as object as, { pending: 10, confirmed: 5, cancelled: 2  }
export async function findBookingStats() {
  const result = await BookingModel.aggregate([
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 }
      }
    }
  ]).then((result) => {
    return result.reduce(
      (acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
      },
      {} as Record<string, number>
    );
  });

  return result;
}

export async function findBookingsByIds(bookingIds: string[]) {
  const bookingObjectIds = bookingIds.map((id) => new Types.ObjectId(id));
  return BookingModel.find({
    _id: { $in: bookingObjectIds }
  });
}
