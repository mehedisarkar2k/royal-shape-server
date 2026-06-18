import { Types } from "mongoose";
import { customAlphabet } from "nanoid";
import { Booking, BookingModel } from "../model";
import { BookingStatus } from "../constants";

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
    },
    status: { $ne: BookingStatus.CANCELLED }
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

export const generateUniqueShortBookingId = async (): Promise<string> => {
  const alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const size = 8;
  const nanoid = customAlphabet(alphabet, size);

  let id: string;
  let exists = true;

  while (exists) {
    id = nanoid();
    exists = !!(await BookingModel.exists({ shortId: id }));
  }

  return id!;
};

export async function getCustomerBookingHistory(customerId: string, page: number, limit: number) {
  const skip = (page - 1) * limit;
  const bookings = await BookingModel.find({ customerId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .sort({ bookingDate: -1 })
    .lean();

  return bookings;
}

export async function countCustomerBookings(customerId: string) {
  return BookingModel.countDocuments({ customerId });
}
