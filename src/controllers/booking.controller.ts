/* eslint-disable */

import { Request, Response } from "express";
import { v4 as uuid } from "uuid";
import {
  SendResponse,
  SendErrorResponse,
  calculateAvailableSlots,
  isValidDate,
  isValidTimeFormat,
  parseDateTimeFromDateAndTimeStr,
  isSlotAvailable
} from "../utils";
import { ConfirmBookingType, RequestBookingType } from "../schemas";
import { findBranchById } from "../services/branch.service";
import {
  countAllBookings,
  createBooking,
  findAllBookingsPaginated,
  findBookingById,
  findBookingsByBranchAndDate,
  findBookingsByIds,
  findBookingStats,
  generateUniqueShortBookingId
} from "../services/booking.service";
import { findServicesByIds } from "../services/business-service.service";
import {
  ApplicationServices,
  BAD_REQUEST,
  BookingServiceType,
  BookingStatus,
  CONFLICT_ERROR,
  DATA_NOT_FOUND,
  UNEXPECTED_ERROR
} from "../constants";
import { createCustomer, findCustomerByEmail, findCustomerById } from "../services/customer.service";

const buildErrorPayload = (
  endpoint: string,
  functionName: string,
  method: string,
  message: string,
  error: { code: string; message: string },
  customMsg: string
) => ({
  message,
  data: {
    clientError: { ...error, message: customMsg },
    endpoint,
    functionName,
    method,
    service: ApplicationServices.BOOKING,
    id: uuid()
  }
});

export async function getAvailableSlotsHandler(req: Request, res: Response) {
  const functionName = getAvailableSlotsHandler.name;
  const { branchId, date, type, serviceIds, comboIds } = req.query;

  try {
    // Validate required parameters
    if (!branchId || !date || !serviceIds) {
      return SendErrorResponse.badRequest({
        res,
        message: "branchId, date, and serviceIds are required"
      });
    }

    if (!isValidDate(date as string)) {
      return SendErrorResponse.badRequest({
        res,
        message: "Invalid date format. Please use YYYY-MM-DD format.",
        data: {
          clientError: {
            ...BAD_REQUEST,
            message: "Invalid date format. If you believe this is an error, please contact support."
          }
        }
      });
    }

    // Parse serviceIds from query parameter
    const serviceIdArray = Array.isArray(serviceIds)
      ? (serviceIds as string[])
      : (serviceIds as string).replace(/\s+/g, "").split(",");

    // Parse date
    const bookingDate = new Date(date as string);
    if (isNaN(bookingDate.getTime())) {
      return SendErrorResponse.badRequest({
        res,
        message: "Invalid date format"
      });
    }

    // Find the branch and its working hours
    const branch = await findBranchById(branchId as string);
    if (!branch) {
      return SendErrorResponse.notFound({
        res,
        message: "Branch not found"
      });
    }

    // Get the day of the week for the booking date
    const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const dayOfWeek = dayNames[bookingDate.getDay()] as keyof typeof branch.weeklySchedule;
    const workingHours = branch.weeklySchedule[dayOfWeek];

    if (!workingHours || !workingHours.open || !workingHours.close) {
      return SendErrorResponse.badRequest({
        res,
        message: "Branch is closed on this day"
      });
    }

    // Find existing bookings for that day and branch
    const existingBookings = await findBookingsByBranchAndDate(branchId as string, bookingDate);

    // Find the services to get duration information
    const services = await findServicesByIds(serviceIdArray);
    if (services.length === 0) {
      return SendErrorResponse.notFound({
        res,
        message: "No services found for the provided service IDs"
      });
    }

    // Calculate available slots
    const availableSlots = calculateAvailableSlots(workingHours, existingBookings, services);

    return SendResponse.success({
      res,
      message: "Available slots fetched successfully",
      data: {
        availableSlots
      }
    });
  } catch (error) {
    console.error(`${functionName} error:`, error);
    return SendErrorResponse.internalServer({
      res,
      message: "Internal server error"
    });
  }
}

export async function requestBookingHandler(
  req: Request<Record<string, never>, Record<string, never>, RequestBookingType>,
  res: Response
) {
  const functionName = requestBookingHandler.name;
  const { branchId, services, combo, date, startTime, endTime, customerInfo } = req.body;

  if (!services && !combo) {
    return SendErrorResponse.badRequest({
      res,
      message: "At least one of services or combo must be provided",
      data: {
        clientError: { ...BAD_REQUEST, message: "At least one of services or combo must be provided" }
      }
    });
  }

  if (!isValidDate(date)) {
    return SendErrorResponse.badRequest({
      res,
      message: "Invalid date format. Please use YYYY-MM-DD format.",
      data: {
        clientError: {
          ...BAD_REQUEST,
          message: "Invalid date format. If you believe this is an error, please contact support."
        }
      }
    });
  }

  if (!isValidTimeFormat(startTime) || !isValidTimeFormat(endTime)) {
    return SendErrorResponse.badRequest({
      res,
      message: "Invalid time format. Please use 'HH:mm a' format.",
      data: {
        clientError: {
          ...BAD_REQUEST,
          message: "Invalid time format. If you believe this is an error, please contact support."
        }
      }
    });
  }

  const requestDate = new Date(date as string);
  const existingBookings = await findBookingsByBranchAndDate(branchId as string, requestDate);
  if (!isSlotAvailable(date, startTime, endTime, existingBookings)) {
    return SendErrorResponse.conflict({
      res,
      message: "Requested time slot is not available",
      data: {
        clientError: {
          ...CONFLICT_ERROR,
          message: "Requested time slot is not available. If you believe this is an error, please contact support."
        }
      }
    });
  }

  const serviceIdArray = services || [];
  const comboId = combo || null;

  const servicesForBooking = await findServicesByIds(serviceIdArray);
  if (servicesForBooking.length === 0) {
    return SendErrorResponse.notFound({
      res,
      message: "No services found for the provided service IDs",
      data: { clientError: { ...DATA_NOT_FOUND, message: "No services found for the provided service IDs" } }
    });
  }
  if (serviceIdArray.length !== servicesForBooking.length) {
    return SendErrorResponse.notFound({
      res,
      message: "Some services not found for the provided service IDs",
      data: { clientError: { ...DATA_NOT_FOUND, message: "Some services not found for the provided service IDs" } }
    });
  }

  // find combos if comboIds are provided

  // * create the customer in DB if not exists
  let customer = await findCustomerByEmail(customerInfo.email.toLowerCase());
  if (!customer) {
    customer = await createCustomer({
      email: customerInfo.email.toLowerCase(),
      firstName: customerInfo.firstName.trim(),
      lastName: (customerInfo.lastName || "").trim(),
      phone: {
        countryCode: customerInfo.phone.countryCode.trim(),
        number: customerInfo.phone.number.trim(),
        e164: `+${customerInfo.phone.countryCode.trim()}${customerInfo.phone.number.trim()}`
      },
      description: (customerInfo.specialNotes || "").trim()
    });
  }

  let totalPrice = 0;
  if (servicesForBooking.length > 0) {
    totalPrice = servicesForBooking.reduce((sum, service) => sum + service.price, 0);
  } else {
    // If combo booking, find the combo and get its price
    totalPrice = 100; // Replace with actual combo price
  }

  const bookingDate = parseDateTimeFromDateAndTimeStr(date, startTime);
  // console.log(bookingDate);
  if (!bookingDate) {
    return SendErrorResponse.badRequest({
      res,
      message: "Invalid date or time format. Parsing from date and time strings failed.",
      data: {
        clientError: {
          ...BAD_REQUEST,
          message: "Invalid date or time format. If you believe this is an error, please contact support."
        }
      }
    });
  }

  const newBooking = await createBooking({
    shortId: await generateUniqueShortBookingId(),
    branchId,
    serviceIds: serviceIdArray,
    serviceType: serviceIdArray.length > 0 ? BookingServiceType.SPECIFIC_SERVICE : BookingServiceType.COMBO,
    comboId,
    customerId: customer._id.toString(),
    bookingDate, // maybe changed
    startTime,
    endTime,
    totalPrice,
    discount: null,
    notes: customerInfo.specialNotes || null,
    status: BookingStatus.PENDING
  });

  return SendResponse.success({
    res,
    message: "Booking requested successfully",
    data: {
      bookingId: newBooking._id.toString()
    }
  });
}

export async function manualCreateBookingHandler(
  req: Request<Record<string, never>, Record<string, never>, RequestBookingType>,
  res: Response
) {
  const functionName = manualCreateBookingHandler.name;
  const { branchId, services, combo, date, startTime, endTime, customerInfo } = req.body;

  if (!services && !combo) {
    return SendErrorResponse.badRequest({
      res,
      ...buildErrorPayload(
        req.originalUrl,
        functionName,
        req.method,
        "At least one of services or combo must be provided",
        BAD_REQUEST,
        "At least one of services or combo must be provided"
      )
    });
  }

  if (!isValidDate(date)) {
    return SendErrorResponse.badRequest({
      res,
      ...buildErrorPayload(
        req.originalUrl,
        functionName,
        req.method,
        "Invalid date format. Please use YYYY-MM-DD format.",
        BAD_REQUEST,
        "Invalid date format. Please use YYYY-MM-DD format."
      )
    });
  }

  if (!isValidTimeFormat(startTime) || !isValidTimeFormat(endTime)) {
    return SendErrorResponse.badRequest({
      res,
      ...buildErrorPayload(
        req.originalUrl,
        functionName,
        req.method,
        "Invalid time format. Please use 'HH:mm a' format.",
        BAD_REQUEST,
        "Invalid time format. Please use 'HH:mm a' format."
      )
    });
  }

  const requestDate = new Date(date as string);
  const existingBookings = await findBookingsByBranchAndDate(branchId as string, requestDate);
  if (!isSlotAvailable(date, startTime, endTime, existingBookings)) {
    return SendErrorResponse.conflict({
      res,
      ...buildErrorPayload(
        req.originalUrl,
        functionName,
        req.method,
        "Requested time slot is not available",
        CONFLICT_ERROR,
        "Requested time slot is not available."
      )
    });
  }

  const serviceIdArray = services || [];
  const comboId = combo || null;

  const servicesForBooking = await findServicesByIds(serviceIdArray);
  if (servicesForBooking.length === 0) {
    return SendErrorResponse.notFound({
      res,
      ...buildErrorPayload(
        req.originalUrl,
        functionName,
        req.method,
        "No services found for the provided service IDs",
        DATA_NOT_FOUND,
        "No services found for the provided service IDs"
      )
    });
  }
  if (serviceIdArray.length !== servicesForBooking.length) {
    return SendErrorResponse.notFound({
      res,
      ...buildErrorPayload(
        req.originalUrl,
        functionName,
        req.method,
        "Some services not found for the provided service IDs",
        DATA_NOT_FOUND,
        "Some services not found for the provided service IDs"
      )
    });
  }

  // find combos if comboIds are provided

  // * create the customer in DB if not exists
  let customer = await findCustomerByEmail(customerInfo.email.toLowerCase());
  if (!customer) {
    customer = await createCustomer({
      email: customerInfo.email.toLowerCase(),
      firstName: customerInfo.firstName.trim(),
      lastName: (customerInfo.lastName || "").trim(),
      phone: {
        countryCode: customerInfo.phone.countryCode.trim(),
        number: customerInfo.phone.number.trim(),
        e164: `+${customerInfo.phone.countryCode.trim()}${customerInfo.phone.number.trim()}`
      },
      description: (customerInfo.specialNotes || "").trim()
    });
  }

  let totalPrice = 0;
  if (servicesForBooking.length > 0) {
    totalPrice = servicesForBooking.reduce((sum, service) => sum + service.price, 0);
  } else {
    // If combo booking, find the combo and get its price
    totalPrice = 100; // Replace with actual combo price
  }

  const bookingDate = parseDateTimeFromDateAndTimeStr(date, startTime);
  // console.log(bookingDate);
  if (!bookingDate) {
    return SendErrorResponse.badRequest({
      res,
      ...buildErrorPayload(
        req.originalUrl,
        functionName,
        req.method,
        "Invalid date or time format. Parsing from date and time strings failed.",
        BAD_REQUEST,
        "Invalid date or time format. Parsing from date and time strings failed."
      )
    });
  }

  const newBooking = await createBooking({
    shortId: await generateUniqueShortBookingId(),
    branchId,
    serviceIds: serviceIdArray,
    serviceType: serviceIdArray.length > 0 ? BookingServiceType.SPECIFIC_SERVICE : BookingServiceType.COMBO,
    comboId,
    customerId: customer._id.toString(),
    bookingDate, // maybe changed
    startTime,
    endTime,
    totalPrice,
    discount: null,
    notes: customerInfo.specialNotes || null,
    status: BookingStatus.CONFIRMED
  });

  return SendResponse.success({
    res,
    message: "Booking requested successfully",
    data: {
      bookingId: newBooking._id.toString()
    }
  });
}

export async function confirmBookingHandler(
  req: Request<Record<string, never>, Record<string, never>, ConfirmBookingType>,
  res: Response
) {
  const functionName = confirmBookingHandler.name;
  const { bookingId } = req.body;

  const booking = await findBookingById(bookingId);
  if (!booking) {
    return SendErrorResponse.notFound({
      res,
      ...buildErrorPayload(
        req.originalUrl,
        functionName,
        req.method,
        "Booking not found",
        DATA_NOT_FOUND,
        "Booking not found"
      )
    });
  }

  if (booking.status === BookingStatus.CANCELLED) {
    return SendErrorResponse.badRequest({
      res,
      ...buildErrorPayload(
        req.originalUrl,
        functionName,
        req.method,
        "Cannot confirm a cancelled booking",
        BAD_REQUEST,
        "Cannot confirm a cancelled booking"
      )
    });
  }

  if (booking.status === BookingStatus.CONFIRMED) {
    return SendErrorResponse.badRequest({
      res,
      ...buildErrorPayload(
        req.originalUrl,
        functionName,
        req.method,
        "Booking is already confirmed",
        BAD_REQUEST,
        "Booking is already confirmed"
      )
    });
  }

  booking.status = BookingStatus.CONFIRMED;
  await booking.save();

  return SendResponse.success({
    res,
    message: "Booking confirmed successfully",
    data: {
      bookingId: booking._id.toString()
    }
  });
}

export async function cancelBookingHandler(
  req: Request<Record<string, never>, Record<string, never>, ConfirmBookingType>,
  res: Response
) {
  const functionName = cancelBookingHandler.name;
  const { bookingId } = req.body;

  const booking = await findBookingById(bookingId);
  if (!booking) {
    return SendErrorResponse.notFound({
      res,
      ...buildErrorPayload(
        req.originalUrl,
        functionName,
        req.method,
        "Booking not found",
        DATA_NOT_FOUND,
        "Booking not found"
      )
    });
  }

  if (booking.status === BookingStatus.CANCELLED) {
    return SendErrorResponse.badRequest({
      res,
      ...buildErrorPayload(
        req.originalUrl,
        functionName,
        req.method,
        "Booking is already cancelled",
        BAD_REQUEST,
        "Booking is already cancelled"
      )
    });
  }

  booking.status = BookingStatus.CANCELLED;
  await booking.save();

  return SendResponse.success({
    res,
    message: "Booking cancelled successfully",
    data: {
      bookingId: booking._id.toString()
    }
  });
}

export async function getAllBookingsHandler(req: Request, res: Response) {
  const functionName = getAllBookingsHandler.name;

  const page = parseInt((req.query.page as string) || "1", 10);
  const limit = parseInt((req.query.limit as string) || "10", 10);

  const bookings = await findAllBookingsPaginated(page, limit);
  const totalBookings = await countAllBookings();

  const hasNext = page * limit < totalBookings;

  const finalBookings = await Promise.all(
    bookings.map(async (booking) => {
      const customerInfo = await findCustomerById(booking.customerId);
      const serviceInfo = await findServicesByIds(booking.serviceIds || []);
      const branchInfo = await findBranchById(booking.branchId);
      if (!customerInfo || !branchInfo || serviceInfo.length === 0) {
        return SendErrorResponse.internalServer({
          res,
          ...buildErrorPayload(
            req.originalUrl,
            functionName,
            req.method,
            "Failed to retrieve booking details",
            UNEXPECTED_ERROR,
            "Failed to retrieve booking details"
          )
        });
      }
      return {
        id: booking._id.toString(),
        shortId: booking.shortId,
        branch: {
          id: branchInfo?._id.toString(),
          name: branchInfo.name
        },
        customer: {
          id: customerInfo._id.toString(),
          name: `${customerInfo.firstName} ${customerInfo.lastName}`.trim()
        },
        services: serviceInfo.map((service) => ({
          id: service._id.toString(),
          name: service.name
        })),
        price: booking.totalPrice,
        date: booking.bookingDate.toISOString().split("T")[0],
        startTime: booking.startTime,
        endTime: booking.endTime,
        status: booking.status
      };
    })
  );

  return SendResponse.success({
    res,
    message: "All bookings retrieved successfully",
    data: {
      items: finalBookings,
      currentPage: page,
      limit,
      totalItems: totalBookings,
      totalPages: Math.ceil(totalBookings / limit),
      hasNext
    }
  });
}

export async function getBookingShortStatsHandler(req: Request, res: Response) {
  // const functionName = getTopSectionBookingStatsHandler.name;

  const statsRes = await findBookingStats();

  return SendResponse.success({
    res,
    message: "Booking stats retrieved successfully",
    data: {
      stats: {
        total:
          (statsRes[BookingStatus.PENDING] || 0) +
          (statsRes[BookingStatus.CONFIRMED] || 0) +
          (statsRes[BookingStatus.CANCELLED] || 0) +
          (statsRes[BookingStatus.COMPLETED] || 0),
        pending: statsRes[BookingStatus.PENDING] || 0,
        confirmed: statsRes[BookingStatus.CONFIRMED] || 0,
        completed: statsRes[BookingStatus.COMPLETED] || 0
      }
    }
  });
}

export async function bulkMarkBookingsAsCompletedHandler(req: Request, res: Response) {
  const functionName = bulkMarkBookingsAsCompletedHandler.name;
  const { bookingIds } = req.body;

  const bookings = await findBookingsByIds(bookingIds);
  if (!bookings || bookings.length === 0) {
    return SendErrorResponse.notFound({
      res,
      ...buildErrorPayload(
        req.originalUrl,
        functionName,
        req.method,
        "No bookings found",
        DATA_NOT_FOUND,
        "No bookings found"
      )
    });
  }

  for (const booking of bookings) {
    if (booking.status === BookingStatus.COMPLETED) {
      continue;
    }

    booking.status = BookingStatus.COMPLETED;
    await booking.save();
  }

  return SendResponse.success({
    res,
    message: "Bookings marked as completed successfully",
    data: {
      bookingIds: bookings.map((booking) => booking._id.toString())
    }
  });
}
