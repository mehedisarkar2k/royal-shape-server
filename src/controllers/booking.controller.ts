/* eslint-disable */

import { Request, Response } from "express";
import {
  SendResponse,
  SendErrorResponse,
  calculateAvailableSlots,
  isValidDate,
  isValidTimeFormat,
  parseDateTimeFromDateAndTimeStr,
  isSlotAvailable
} from "../utils";
import { RequestBookingType } from "../schemas";
import { findBranchById } from "../services/branch.service";
import { createBooking, findBookingsByBranchAndDate } from "../services/booking.service";
import { findServicesByIds } from "../services/business-service.service";
import { BAD_REQUEST, BookingServiceType, BookingStatus, CONFLICT_ERROR, DATA_NOT_FOUND } from "../constants";
import { createCustomer, findCustomerByEmail } from "../services/customer.service";

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
