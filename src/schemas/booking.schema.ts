import { array, object, string, TypeOf } from "zod";

export const requestBookingSchema = object({
  body: object({
    branchId: string().min(1, "Branch ID is required"),
    services: array(string().min(1)).min(1, "At least one service is required").optional().nullable(),
    combo: string().min(1).optional().nullable(),
    date: string().min(1, "Date is required"),
    startTime: string().min(1, "Start time is required"),
    endTime: string().min(1, "End time is required"),
    customerInfo: object({
      firstName: string().min(1, "First name is required"),
      lastName: string().optional().nullable(),
      email: string().email("Invalid email"),
      phone: object({
        countryCode: string().min(1, "Country code is required"),
        number: string().min(1, "Phone number is required")
      }),
      specialNotes: string().optional().nullable()
    })
  })
});

export type RequestBookingType = TypeOf<typeof requestBookingSchema>["body"];

export const confirmBookingSchema = object({
  body: object({
    bookingId: string().min(1, "Booking ID is required")
  })
});
export type ConfirmBookingType = TypeOf<typeof confirmBookingSchema>["body"];

export const bulkMarkBookingsSchema = object({
  body: object({
    bookingIds: array(string().min(1)).min(1, "At least one booking ID is required")
  })
});
export type BulkMarkBookingsType = TypeOf<typeof bulkMarkBookingsSchema>["body"];
