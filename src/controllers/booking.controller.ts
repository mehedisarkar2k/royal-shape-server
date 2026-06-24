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
  isSlotAvailable,
  sendBookingRequestEmail,
  logger,
  sendBookingRequestSubmissionEmailToAdmin,
  sendBookingConfirmationEmail,
  sendBookingCancellationEmail,
  sendBookingUpdateEmail,
  sendReviewRequestEmail,
  sendSms,
  appCache,
  clearCacheByPrefix
} from "../utils";
import { ConfirmBookingType, RequestBookingType, UpdateBookingType } from "../schemas";
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
import { findServiceCategoryById, findServicesByIds } from "../services/business-service.service";
import {
  ApplicationServices,
  BAD_REQUEST,
  BookingServiceType,
  BookingStatus,
  CONFLICT_ERROR,
  DATA_NOT_FOUND,
  UNAUTHORIZED_ERROR,
  UNEXPECTED_ERROR,
  UserType
} from "../constants";
import { createCustomer, findCustomerByEmail, findCustomerById, findCustomerIdsBySearch } from "../services/customer.service";
import { findComboById } from "../services";
import { BusinessInfoModel } from "../model";
import { generateAndUploadReceipt } from "../services/receipt.service";

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

/** Drops every cached booking response affected by a create/status/update mutation. */
const invalidateBookingCaches = (bookingId?: string) => {
  clearCacheByPrefix("bookings_all_");
  appCache.del("booking_short_stats");
  if (bookingId) {
    appCache.del(`booking_single_${bookingId}`);
    appCache.del(`booking_public_single_${bookingId}`);
  }
};

export async function getAvailableSlotsHandler(req: Request, res: Response) {
  const functionName = getAvailableSlotsHandler.name;
  const { branchId, date, type, serviceIds, comboId } = req.query;

  try {
    // Validate required parameters: serviceIds or comboId is required
    if (!branchId || !date || (!serviceIds && !comboId)) {
      return SendErrorResponse.badRequest({
        res,
        message: "branchId, date, and serviceIds or comboId are required"
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

    if (comboId) {
      const comboService = await findComboById(comboId as string);
      if (!comboService) {
        return SendErrorResponse.notFound({
          res,
          message: "Combo not found"
        });
      }

      // Calculate available slots
      const availableSlots = calculateAvailableSlots(workingHours, existingBookings, [
        { duration: comboService.duration }
      ]);

      return SendResponse.success({
        res,
        message: "Available slots fetched successfully",
        data: {
          availableSlots
        }
      });
    }

    // Parse serviceIds from query parameter
    const serviceIdArray = Array.isArray(serviceIds)
      ? (serviceIds as string[])
      : (serviceIds as string).replace(/\s+/g, "").split(",");

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
  // No requireUser on this route — a present res.locals.user means an authenticated
  // customer made this request; absent means a guest, which admins need to filter on.
  const isGuestBooking = !res.locals.user;

  if ((!services || services.length === 0) && !combo) {
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

  if (comboId) {
    const comboService = await findComboById(comboId);
    if (!comboService) {
      return SendErrorResponse.notFound({
        res,
        message: "Combo not found",
        data: { clientError: { ...DATA_NOT_FOUND, message: "No combo found" } }
      });
    }

    const branch = await findBranchById(branchId);
    if (!branch) {
      return SendErrorResponse.notFound({
        res,
        ...buildErrorPayload(
          req.originalUrl,
          functionName,
          req.method,
          "Branch not found",
          DATA_NOT_FOUND,
          "Branch not found"
        )
      });
    }

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
    if (!customer.phone) {
      customer.phone = {
        countryCode: customerInfo.phone.countryCode.trim(),
        number: customerInfo.phone.number.trim(),
        e164: `+${customerInfo.phone.countryCode.trim()}${customerInfo.phone.number.trim()}`
      };
      await customer.save();
    }

    const bookingDate = parseDateTimeFromDateAndTimeStr(date, startTime);
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
      branchName: branch.name,
      serviceIds: null,
      serviceType: BookingServiceType.COMBO,
      comboId: comboService._id.toString(),
      customerId: customer._id.toString(),
      bookingDate,
      startTime,
      endTime,
      totalPrice: comboService.price,
      discount: null,
      notes: customerInfo.specialNotes || null,
      status: BookingStatus.PENDING,
      isGuestBooking
    });

    const businessInfo = await BusinessInfoModel.findOne({});
    const companyName = businessInfo?.name || "Royal Threading & Beauty";
    // Send booking request email to customer
    if (customer.email) {
      try {
        const supportEmail = branch.email;
        const supportPhone = branch.phone;
        await sendBookingRequestEmail({
          bookingId: newBooking.shortId,
          service: comboService.name,
          date: newBooking.bookingDate.toISOString().split("T")[0],
          time: newBooking.startTime,
          amount: `AUD ${newBooking.totalPrice}`,
          customerName: `${customer.firstName} ${customer.lastName}`.trim(),
          customerEmail: customer.email,
          companyName,
          supportEmail,
          supportPhone: supportPhone.e164
        });
      } catch (error) {
        logger.error(
          `Failed to send booking request email for booking ID: ${newBooking._id.toString()}. Error: ${(error as Error).message}`
        );
      }
    }

    // Send booking request submission email to admin
    try {
      await sendBookingRequestSubmissionEmailToAdmin({
        bookingId: newBooking.shortId,
        service: comboService.name,
        date: newBooking.bookingDate.toISOString().split("T")[0],
        time: newBooking.startTime,
        amount: `AUD ${newBooking.totalPrice}`,
        customerName: `${customer.firstName} ${customer.lastName}`.trim(),
        customerEmail: customer.email || "N/A",
        customerPhone: customer.phone ? customer.phone.e164 : "N/A",
        companyName
      });
    } catch (error) {
      logger.error(
        `Failed to send booking request submission email to ADMIN for booking ID: ${newBooking._id.toString()}. Error: ${(error as Error).message}`
      );
    }

    let receiptKey: string | null = null;
    try {
      receiptKey = await generateAndUploadReceipt({
        bookingId: newBooking._id.toString(),
        shortId: newBooking.shortId,
        companyName,
        branchName: branch.name,
        branchAddress: `${branch.address.addressLine1}, ${branch.address.city || ""} ${branch.address.state || ""} ${branch.address.zipCode || ""}`.trim(),
        branchPhone: branch.phone.e164,
        customerName: `${customer.firstName} ${customer.lastName}`.trim(),
        customerEmail: customer.email || "N/A",
        customerPhone: customer.phone ? customer.phone.e164 : "N/A",
        lineItems: [{ name: comboService.name, duration: comboService.duration, price: comboService.price }],
        date: newBooking.bookingDate.toISOString().split("T")[0],
        startTime: newBooking.startTime,
        endTime: newBooking.endTime,
        totalPrice: newBooking.totalPrice,
        status: newBooking.status
      });
      if (receiptKey) {
        newBooking.receiptKey = receiptKey;
        await newBooking.save();
      }
    } catch (error) {
      logger.error(
        `Failed to generate receipt for booking ID: ${newBooking._id.toString()}. Error: ${(error as Error).message}`
      );
    }

    invalidateBookingCaches();

    return SendResponse.success({
      res,
      message: "Booking requested successfully",
      data: {
        bookingId: newBooking._id.toString(),
        receiptKey
      }
    });
  }

  // * If services provided
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

  const branch = await findBranchById(branchId);
  if (!branch) {
    return SendErrorResponse.notFound({
      res,
      ...buildErrorPayload(
        req.originalUrl,
        functionName,
        req.method,
        "Branch not found",
        DATA_NOT_FOUND,
        "Branch not found"
      )
    });
  }

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
  totalPrice = servicesForBooking.reduce((sum, service) => sum + service.price, 0);

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
    branchName: branch.name,
    serviceIds: serviceIdArray,
    serviceType: BookingServiceType.SPECIFIC_SERVICE,
    comboId: null,
    customerId: customer._id.toString(),
    bookingDate,
    startTime,
    endTime,
    totalPrice,
    discount: null,
    notes: customerInfo.specialNotes || null,
    status: BookingStatus.PENDING,
    isGuestBooking
  });

  const businessInfo = await BusinessInfoModel.findOne({});
  const companyName = businessInfo?.name || "Royal Threading & Beauty";
  // Send booking request email to customer
  if (customer.email) {
    try {
      const supportEmail = branch.email;
      const supportPhone = branch.phone;
      await sendBookingRequestEmail({
        bookingId: newBooking.shortId,
        service: servicesForBooking.map((s) => s.name).join(", "),
        date: newBooking.bookingDate.toISOString().split("T")[0],
        time: newBooking.startTime,
        amount: `AUD ${newBooking.totalPrice}`,
        customerName: `${customer.firstName} ${customer.lastName}`.trim(),
        customerEmail: customer.email,
        companyName,
        supportEmail,
        supportPhone: supportPhone.e164
      });
    } catch (error) {
      logger.error(
        `Failed to send booking request email for booking ID: ${newBooking._id.toString()}. Error: ${(error as Error).message}`
      );
    }
  }

  // Send booking request submission email to admin
  try {
    await sendBookingRequestSubmissionEmailToAdmin({
      bookingId: newBooking.shortId,
      service: servicesForBooking.map((s) => s.name).join(", "),
      date: newBooking.bookingDate.toISOString().split("T")[0],
      time: newBooking.startTime,
      amount: `AUD ${newBooking.totalPrice}`,
      customerName: `${customer.firstName} ${customer.lastName}`.trim(),
      customerEmail: customer.email || "N/A",
      customerPhone: customer.phone ? customer.phone.e164 : "N/A",
      companyName
    });
  } catch (error) {
    logger.error(
      `Failed to send booking request submission email to ADMIN for booking ID: ${newBooking._id.toString()}. Error: ${(error as Error).message}`
    );
  }

  let receiptKey: string | null = null;
  try {
    receiptKey = await generateAndUploadReceipt({
      bookingId: newBooking._id.toString(),
      shortId: newBooking.shortId,
      companyName,
      branchName: branch.name,
      branchAddress: `${branch.address.addressLine1}, ${branch.address.city || ""} ${branch.address.state || ""} ${branch.address.zipCode || ""}`.trim(),
      branchPhone: branch.phone.e164,
      customerName: `${customer.firstName} ${customer.lastName}`.trim(),
      customerEmail: customer.email || "N/A",
      customerPhone: customer.phone ? customer.phone.e164 : "N/A",
      lineItems: servicesForBooking.map((s) => ({ name: s.name, duration: s.duration, price: s.price })),
      date: newBooking.bookingDate.toISOString().split("T")[0],
      startTime: newBooking.startTime,
      endTime: newBooking.endTime,
      totalPrice: newBooking.totalPrice,
      status: newBooking.status
    });
    if (receiptKey) {
      newBooking.receiptKey = receiptKey;
      await newBooking.save();
    }
  } catch (error) {
    logger.error(
      `Failed to generate receipt for booking ID: ${newBooking._id.toString()}. Error: ${(error as Error).message}`
    );
  }

  invalidateBookingCaches();

  return SendResponse.success({
    res,
    message: "Booking requested successfully",
    data: {
      bookingId: newBooking._id.toString(),
      receiptKey
    }
  });
}

export async function manualCreateBookingHandler(
  req: Request<Record<string, never>, Record<string, never>, RequestBookingType>,
  res: Response
) {
  const functionName = manualCreateBookingHandler.name;
  const { branchId, services, combo, date, startTime, endTime, customerInfo } = req.body;

  if ((!services || services.length === 0) && !combo) {
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

  let servicesForBooking: any[] = [];
  if (serviceIdArray.length > 0) {
    servicesForBooking = await findServicesByIds(serviceIdArray);
    if (servicesForBooking.length === 0 || serviceIdArray.length !== servicesForBooking.length) {
      return SendErrorResponse.notFound({
        res,
        ...buildErrorPayload(
          req.originalUrl,
          functionName,
          req.method,
          "Some or all services not found for the provided service IDs",
          DATA_NOT_FOUND,
          "Some or all services not found for the provided service IDs"
        )
      });
    }
  }

  const branch = await findBranchById(branchId);
  if (!branch) {
    return SendErrorResponse.notFound({
      res,
      ...buildErrorPayload(
        req.originalUrl,
        functionName,
        req.method,
        "Branch not found",
        DATA_NOT_FOUND,
        "Branch not found"
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
  if (comboId) {
    const comboService = await findComboById(comboId);
    if (!comboService) {
      return SendErrorResponse.notFound({
        res,
        ...buildErrorPayload(req.originalUrl, functionName, req.method, "Combo not found", DATA_NOT_FOUND, "Combo not found")
      });
    }
    totalPrice = comboService.price;
  } else if (servicesForBooking.length > 0) {
    totalPrice = servicesForBooking.reduce((sum, service) => sum + service.price, 0);
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
    branchName: branch.name,
    serviceIds: comboId ? null : serviceIdArray,
    serviceType: comboId ? BookingServiceType.COMBO : BookingServiceType.SPECIFIC_SERVICE,
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

  invalidateBookingCaches();

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

  const customer = await findCustomerById(booking.customerId);
  if (!customer) {
    return SendErrorResponse.notFound({
      res,
      ...buildErrorPayload(
        req.originalUrl,
        functionName,
        req.method,
        "Customer not found",
        DATA_NOT_FOUND,
        "Customer not found"
      )
    });
  }
  const branch = await findBranchById(booking.branchId);
  if (!branch) {
    return SendErrorResponse.notFound({
      res,
      ...buildErrorPayload(
        req.originalUrl,
        functionName,
        req.method,
        "Branch not found",
        DATA_NOT_FOUND,
        "Branch not found"
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

  const businessInfo = await BusinessInfoModel.findOne({});
  const companyName = businessInfo?.name || "Royal Threading & Beauty";

  let services = "";
  if (booking.serviceType === BookingServiceType.COMBO && booking.comboId) {
    const comboService = await findComboById(booking.comboId);
    services = comboService ? comboService.name : "N/A";
  } else {
    const serviceDocs = await findServicesByIds(booking.serviceIds || []);
    services = serviceDocs.map((s) => s.name).join(", ");
  }

  // Send booking confirmation email to customer
  if (customer.email) {
    try {
      const supportEmail = branch.email;
      const supportPhone = branch.phone;
      await sendBookingConfirmationEmail({
        bookingId: booking.shortId,
        service: services,
        date: booking.bookingDate.toISOString().split("T")[0],
        time: booking.startTime,
        amount: `AUD ${booking.totalPrice}`,
        customerName: `${customer.firstName} ${customer.lastName}`.trim(),
        customerEmail: customer.email,
        companyName,
        supportEmail,
        supportPhone: supportPhone.e164
      });
    } catch (error) {
      logger.error(
        `Failed to send booking confirmation email for booking ID: ${booking._id.toString()}. Error: ${(error as Error).message}`
      );
    }
  }

  invalidateBookingCaches(booking._id.toString());

  return SendResponse.success({
    res,
    message: "Booking confirmed successfully",
    data: {
      bookingId: booking._id.toString()
    }
  });
}

type BookingForEmail = {
  shortId: string;
  serviceType: string;
  comboId?: string | null;
  serviceIds?: string[] | null;
  bookingDate: Date;
  startTime: string;
  totalPrice: number;
  customerId: string;
  branchId: string;
};

// Notifies the customer by email when their booking is cancelled or updated.
// Best-effort: never throws (failures are logged so the request still succeeds).
async function sendBookingChangeEmail(booking: BookingForEmail, kind: "cancelled" | "updated", reason?: string | null) {
  try {
    const customer = await findCustomerById(booking.customerId);
    if (!customer?.email) return;

    const branch = await findBranchById(booking.branchId);
    if (!branch) return;

    const businessInfo = await BusinessInfoModel.findOne({});
    const companyName = businessInfo?.name || "Royal Threading & Beauty";

    let service = "";
    if (booking.serviceType === BookingServiceType.COMBO && booking.comboId) {
      const comboService = await findComboById(booking.comboId);
      service = comboService ? comboService.name : "N/A";
    } else {
      const serviceDocs = await findServicesByIds(booking.serviceIds || []);
      service = serviceDocs.map((s) => s.name).join(", ");
    }

    const common = {
      bookingId: booking.shortId,
      service,
      date: booking.bookingDate.toISOString().split("T")[0],
      time: booking.startTime,
      customerName: `${customer.firstName} ${customer.lastName}`.trim(),
      customerEmail: customer.email,
      companyName,
      supportEmail: branch.email,
      supportPhone: branch.phone.e164
    };

    if (kind === "cancelled") {
      await sendBookingCancellationEmail({ ...common, reason });
    } else {
      await sendBookingUpdateEmail({ ...common, amount: `AUD ${booking.totalPrice}` });
    }
  } catch (error) {
    logger.error(`Failed to send booking ${kind} email: ${(error as Error).message}`);
  }
}

// After a visit is completed, invite the customer to leave a review via email + SMS.
// Prefers the branch's Google review link (boosts Google rating); falls back to the
// on-site /write-review form. Best-effort: never throws.
async function sendBookingSurvey(booking: BookingForEmail) {
  try {
    const customer = await findCustomerById(booking.customerId);
    if (!customer) return;

    const branch = await findBranchById(booking.branchId);
    const businessInfo = await BusinessInfoModel.findOne({});
    const companyName = businessInfo?.name || "Royal Threading & Beauty";
    const clientBaseUrl = process.env.CLIENT_BASE_URL || "https://royalthreadingandbeauty.com.au";
    const reviewLink = branch?.googleReviewLink || `${clientBaseUrl}/write-review`;

    if (customer.email) {
      await sendReviewRequestEmail(
        customer.email,
        companyName,
        branch?.email || businessInfo?.email || "",
        branch?.phone?.e164 || "",
        reviewLink
      );
    }

    if (customer.phone?.e164) {
      const message = `Hi ${customer.firstName || ""}, thanks for visiting ${companyName}! We'd love your feedback — please leave a review: ${reviewLink}`;
      await sendSms(customer.phone.e164, message);
    }
  } catch (error) {
    logger.error(`Failed to send booking survey: ${(error as Error).message}`);
  }
}

export async function cancelBookingHandler(
  req: Request<Record<string, never>, Record<string, never>, ConfirmBookingType>,
  res: Response
) {
  const functionName = cancelBookingHandler.name;
  const { bookingId } = req.body;
  // Optional admin-provided reason (not part of confirmBookingSchema; read directly).
  const reason = (req.body as { reason?: string }).reason?.trim() || null;

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
  booking.cancellationReason = reason;
  await booking.save();

  await sendBookingChangeEmail(booking, "cancelled", reason);

  invalidateBookingCaches(booking._id.toString());

  return SendResponse.success({
    res,
    message: "Booking cancelled successfully",
    data: {
      bookingId: booking._id.toString()
    }
  });
}

const MIN_CANCELLATION_NOTICE_HOURS = 24;

/** Self-service cancellation for the logged-in customer: unlike cancelBookingHandler
 *  (admin tool, any booking, any time), this only lets a customer cancel their own
 *  booking, and only while it's still more than 24h away. */
export async function cancelOwnBookingHandler(
  req: Request<Record<string, never>, Record<string, never>, ConfirmBookingType>,
  res: Response
) {
  const functionName = cancelOwnBookingHandler.name;
  const { bookingId } = req.body;
  const currentUser = res.locals.user;

  if (currentUser.userType !== UserType.CUSTOMER) {
    return SendErrorResponse.unauthorized({
      res,
      ...buildErrorPayload(
        req.originalUrl,
        functionName,
        req.method,
        "This endpoint is only accessible to customers",
        UNAUTHORIZED_ERROR,
        "You are not authorized to access this endpoint"
      )
    });
  }

  const customer = await findCustomerByEmail(currentUser.email);
  if (!customer) {
    return SendErrorResponse.notFound({
      res,
      ...buildErrorPayload(
        req.originalUrl,
        functionName,
        req.method,
        "Customer not found",
        DATA_NOT_FOUND,
        "Customer not found"
      )
    });
  }

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

  if (booking.customerId !== customer._id.toString()) {
    return SendErrorResponse.unauthorized({
      res,
      ...buildErrorPayload(
        req.originalUrl,
        functionName,
        req.method,
        "This booking does not belong to the requesting customer",
        UNAUTHORIZED_ERROR,
        "You are not authorized to cancel this booking"
      )
    });
  }

  if (booking.status === BookingStatus.CANCELLED || booking.status === BookingStatus.COMPLETED) {
    return SendErrorResponse.badRequest({
      res,
      ...buildErrorPayload(
        req.originalUrl,
        functionName,
        req.method,
        `Booking is already ${booking.status}`,
        BAD_REQUEST,
        `This booking is already ${booking.status} and can't be cancelled`
      )
    });
  }

  const hoursUntilBooking = (booking.bookingDate.getTime() - Date.now()) / (1000 * 60 * 60);
  if (hoursUntilBooking < MIN_CANCELLATION_NOTICE_HOURS) {
    return SendErrorResponse.badRequest({
      res,
      ...buildErrorPayload(
        req.originalUrl,
        functionName,
        req.method,
        "Booking is too close to be cancelled",
        BAD_REQUEST,
        "Bookings can only be cancelled at least 24 hours before the appointment. Please contact us directly."
      )
    });
  }

  booking.status = BookingStatus.CANCELLED;
  await booking.save();

  await sendBookingChangeEmail(booking, "cancelled");

  invalidateBookingCaches(booking._id.toString());

  return SendResponse.success({
    res,
    message: "Booking cancelled successfully",
    data: {
      bookingId: booking._id.toString()
    }
  });
}

export async function markBookingAsCompletedHandler(
  req: Request<Record<string, never>, Record<string, never>, ConfirmBookingType>,
  res: Response
) {
  const functionName = markBookingAsCompletedHandler.name;
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

  if (booking.status === BookingStatus.COMPLETED) {
    return SendErrorResponse.badRequest({
      res,
      ...buildErrorPayload(
        req.originalUrl,
        functionName,
        req.method,
        "Booking is already completed",
        BAD_REQUEST,
        "Booking is already completed"
      )
    });
  }

  booking.status = BookingStatus.COMPLETED;
  await booking.save();

  await sendBookingSurvey(booking);

  invalidateBookingCaches(booking._id.toString());

  return SendResponse.success({
    res,
    message: "Booking marked as completed successfully",
    data: {
      bookingId: booking._id.toString()
    }
  });
}

export async function getAllBookingsHandler(req: Request, res: Response) {
  const functionName = getAllBookingsHandler.name;

  const page = parseInt((req.query.page as string) || "1", 10);
  const limit = parseInt((req.query.limit as string) || "10", 10);

  const status = (req.query.status as string)?.trim() || undefined;
  const branchId = (req.query.branchId as string)?.trim() || undefined;
  const search = (req.query.search as string)?.trim() || undefined;

  // Resolve the free-text search against customers so name/email/phone matches work,
  // not just the booking shortId.
  const customerIds = search ? await findCustomerIdsBySearch(search) : undefined;

  const filter = { status, branchId, search, customerIds };

  const cacheKey = `bookings_all_page_${page}_limit_${limit}_${status || ""}_${branchId || ""}_${search || ""}`;

  const bookings = await findAllBookingsPaginated(page, limit, filter);
  const totalBookings = await countAllBookings(filter);

  const hasNext = page * limit < totalBookings;

  const finalBookings = await Promise.all(
    bookings.map(async (booking) => {
      const customerInfo = await findCustomerById(booking.customerId);
      const branchInfo = await findBranchById(booking.branchId);

      if (booking.serviceType === BookingServiceType.COMBO && booking.comboId) {
        const combo = await findComboById(booking.comboId!);
        return {
          id: booking._id.toString(),
          shortId: booking.shortId,
          bookingType: booking.serviceType,
          branch: {
            id: branchInfo ? branchInfo._id.toString() : "N/A",
            name: branchInfo ? branchInfo.name : "N/A"
          },
          customer: {
            id: customerInfo ? customerInfo._id.toString() : "N/A",
            name: customerInfo ? `${customerInfo.firstName} ${customerInfo.lastName}`.trim() : "N/A"
          },
          services: [
            {
              id: combo ? combo._id.toString() : booking.comboId,
              name: combo ? combo.name : "Deleted Combo"
            }
          ],
          price: booking.totalPrice,
          date: booking.bookingDate.toISOString().split("T")[0],
          startTime: booking.startTime,
          endTime: booking.endTime,
          status: booking.status,
          isGuestBooking: Boolean(booking.isGuestBooking)
        };
      }
      const serviceInfo = await findServicesByIds(booking.serviceIds || []);
      return {
        id: booking._id.toString(),
        shortId: booking.shortId,
        bookingType: booking.serviceType,
        branch: {
          id: branchInfo ? branchInfo._id.toString() : "N/A",
          name: branchInfo ? branchInfo.name : "N/A"
        },
        customer: {
          id: customerInfo ? customerInfo._id.toString() : "N/A",
          name: customerInfo ? `${customerInfo.firstName} ${customerInfo.lastName}`.trim() : "N/A"
        },
        services: serviceInfo.map((service) => ({
          id: service._id.toString(),
          name: service.name
        })),
        price: booking.totalPrice,
        date: booking.bookingDate.toISOString().split("T")[0],
        startTime: booking.startTime,
        endTime: booking.endTime,
        status: booking.status,
        isGuestBooking: Boolean(booking.isGuestBooking)
      };
    })
  );

  const responseData = {
    items: finalBookings,
    currentPage: page,
    limit,
    totalItems: totalBookings,
    totalPages: Math.ceil(totalBookings / limit),
    hasNext
  };

  // appCache.set(cacheKey, responseData);

  return SendResponse.success({
    res,
    message: "All bookings retrieved successfully",
    data: responseData
  });
}

export async function getBookingShortStatsHandler(req: Request, res: Response) {
  // const functionName = getTopSectionBookingStatsHandler.name;

  const cacheKey = "booking_short_stats";

  const statsRes = await findBookingStats();

  const responseData = {
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
  };

  // appCache.set(cacheKey, responseData);

  return SendResponse.success({
    res,
    message: "Booking stats retrieved successfully",
    data: responseData
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
     
    await sendBookingSurvey(booking);
    invalidateBookingCaches(booking._id.toString());
  }

  return SendResponse.success({
    res,
    message: "Bookings marked as completed successfully",
    data: {
      bookingIds: bookings.map((booking) => booking._id.toString())
    }
  });
}

export async function getSingleBookingHandler(req: Request, res: Response) {
  const functionName = getSingleBookingHandler.name;
  const { bookingId } = req.params;

  const cacheKey = `booking_single_${bookingId}`;

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

  const customerInfo = await findCustomerById(booking.customerId);
  const branchInfo = await findBranchById(booking.branchId);

  if (!customerInfo || !branchInfo) {
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

  if (booking.serviceType === BookingServiceType.COMBO && booking.comboId) {
    const combo = await findComboById(booking.comboId);

    const formattedBooking = {
      id: booking._id.toString(),
      bookingType: booking.serviceType,
      shortId: booking.shortId,
      branch: {
        id: branchInfo._id.toString(),
        name: branchInfo.name
      },
      customer: {
        id: customerInfo._id.toString(),
        name: `${customerInfo.firstName} ${customerInfo.lastName}`.trim(),
        email: customerInfo.email,
        phone: customerInfo.phone,
        description: customerInfo.description || ""
      },
      category: {
        id: "COMBO",
        name: "Combo Service"
      },
      services: [
        {
          id: combo ? combo._id.toString() : booking.comboId,
          name: combo ? combo.name : "Deleted Combo"
        }
      ],
      price: booking.totalPrice,
      date: booking.bookingDate.toISOString().split("T")[0],
      startTime: booking.startTime,
      endTime: booking.endTime,
      status: booking.status,
      isGuestBooking: Boolean(booking.isGuestBooking),
      receiptKey: booking.receiptKey ?? null
    };

    // appCache.set(cacheKey, { booking: formattedBooking });

    return SendResponse.success({
      res,
      message: "Booking retrieved successfully",
      data: {
        booking: formattedBooking
      }
    });
  }

  // Be resilient if the referenced services/category were deleted: show placeholders
  // instead of failing the whole booking view.
  const serviceInfo = await findServicesByIds(booking.serviceIds || []);
  const serviceCategory = serviceInfo.length > 0 ? await findServiceCategoryById(serviceInfo[0].categoryId) : null;

  const formattedBooking = {
    id: booking._id.toString(),
    shortId: booking.shortId,
    bookingType: booking.serviceType,
    branch: {
      id: branchInfo._id.toString(),
      name: branchInfo.name
    },
    customer: {
      id: customerInfo._id.toString(),
      name: `${customerInfo.firstName} ${customerInfo.lastName}`.trim(),
      email: customerInfo.email,
      phone: customerInfo.phone,
      description: customerInfo.description || ""
    },
    category: {
      id: serviceCategory ? serviceCategory._id.toString() : "N/A",
      name: serviceCategory ? serviceCategory.name : "N/A"
    },
    services:
      serviceInfo.length > 0
        ? serviceInfo.map((service) => ({
            id: service._id.toString(),
            name: service.name
          }))
        : [{ id: "N/A", name: "Deleted Service(s)" }],
    price: booking.totalPrice,
    date: booking.bookingDate.toISOString().split("T")[0],
    startTime: booking.startTime,
    endTime: booking.endTime,
    status: booking.status,
    isGuestBooking: Boolean(booking.isGuestBooking),
    receiptKey: booking.receiptKey ?? null
  };

  // appCache.set(cacheKey, { booking: formattedBooking });

  return SendResponse.success({
    res,
    message: "Booking retrieved successfully",
    data: {
      booking: formattedBooking
    }
  });
}

export async function getPublicSingleBookingHandler(req: Request, res: Response) {
  const functionName = getPublicSingleBookingHandler.name;
  const { bookingId } = req.params;

  const cacheKey = `booking_public_single_${bookingId}`;

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

  if (booking.serviceType === BookingServiceType.COMBO && booking.comboId) {
    const customerInfo = await findCustomerById(booking.customerId);
    const branchInfo = await findBranchById(booking.branchId);

    if (!customerInfo || !branchInfo) {
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

    const combo = await findComboById(booking.comboId);

    const formattedBooking = {
      id: booking._id.toString(),
      shortId: booking.shortId,
      branch: {
        id: branchInfo._id.toString(),
        name: branchInfo.name
      },
      services: [
        {
          id: booking.comboId,
          name: combo ? combo.name : "Deleted Combo"
        }
      ],
      price: booking.totalPrice,
      date: booking.bookingDate.toISOString().split("T")[0],
      startTime: booking.startTime,
      endTime: booking.endTime,
      status: booking.status,
      receiptKey: booking.receiptKey ?? null
    };

    // appCache.set(cacheKey, { booking: formattedBooking });

    return SendResponse.success({
      res,
      message: "Booking retrieved successfully",
      data: {
        booking: formattedBooking
      }
    });
  }

  // * If not combo booking, specific service booking
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

  const serviceCategory = await findServiceCategoryById(serviceInfo[0].categoryId);
  if (!serviceCategory) {
    return SendErrorResponse.internalServer({
      res,
      ...buildErrorPayload(
        req.originalUrl,
        functionName,
        req.method,
        "Service category not found while retrieving booking details",
        DATA_NOT_FOUND,
        "Service category not found while retrieving booking details"
      )
    });
  }

  const formattedBooking = {
    id: booking._id.toString(),
    shortId: booking.shortId,
    branch: {
      id: branchInfo._id.toString(),
      name: branchInfo.name
    },
    services: serviceInfo.map((service) => ({
      id: service._id.toString(),
      name: service.name
    })),
    price: booking.totalPrice,
    date: booking.bookingDate.toISOString().split("T")[0],
    startTime: booking.startTime,
    endTime: booking.endTime,
    status: booking.status,
    receiptKey: booking.receiptKey ?? null
  };

  // appCache.set(cacheKey, { booking: formattedBooking });

  return SendResponse.success({
    res,
    message: "Booking retrieved successfully",
    data: {
      booking: formattedBooking
    }
  });
}

export async function updateBookingHandler(
  req: Request<Record<string, never>, Record<string, never>, UpdateBookingType>,
  res: Response
) {
  const functionName = updateBookingHandler.name;
  const { bookingId } = req.params;
  const data = req.body;

  if ((!data.services || data.services.length === 0) && !data.combo) {
    return SendErrorResponse.badRequest({
      res,
      ...buildErrorPayload(
        req.originalUrl,
        functionName,
        req.method,
        "At least one service or combo is required",
        BAD_REQUEST,
        "At least one service or combo is required"
      )
    });
  }

  if (data.date && !isValidDate(data.date)) {
    return SendErrorResponse.badRequest({
      res,
      ...buildErrorPayload(
        req.originalUrl,
        functionName,
        req.method,
        "Invalid date format",
        BAD_REQUEST,
        "Invalid date format"
      )
    });
  }

  if ((data.startTime && !isValidTimeFormat(data.startTime)) || (data.endTime && !isValidTimeFormat(data.endTime))) {
    return SendErrorResponse.badRequest({
      res,
      ...buildErrorPayload(
        req.originalUrl,
        functionName,
        req.method,
        "Invalid time format",
        BAD_REQUEST,
        "Invalid time format"
      )
    });
  }

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

  // recalculate total price based on NEW data
  let updatedTotalPrice = 0;
  const comboToUse = data.combo || booking.comboId;
  const servicesToUse = data.services || booking.serviceIds || [];

  if (data.combo) {
    const comboService = await findComboById(data.combo);
    if (!comboService) {
      return SendErrorResponse.notFound({
        res,
        ...buildErrorPayload(req.originalUrl, functionName, req.method, "Combo not found", DATA_NOT_FOUND, "Combo not found")
      });
    }
    updatedTotalPrice = comboService.price;
  } else if (data.services && data.services.length > 0) {
    const servicesForBooking = await findServicesByIds(data.services);
    if (servicesForBooking.length === 0 || data.services.length !== servicesForBooking.length) {
      return SendErrorResponse.notFound({
        res,
        ...buildErrorPayload(req.originalUrl, functionName, req.method, "Some services not found", DATA_NOT_FOUND, "Some services not found")
      });
    }
    updatedTotalPrice = servicesForBooking.reduce((sum, service) => sum + service.price, 0);
  } else if (comboToUse) {
    const comboService = await findComboById(comboToUse);
    updatedTotalPrice = comboService ? comboService.price : booking.totalPrice;
  } else {
    const servicesForBooking = await findServicesByIds(servicesToUse);
    updatedTotalPrice = servicesForBooking.reduce((sum, service) => sum + service.price, 0);
  }

  // check slot availability
  if (
    data.date !== booking.bookingDate.toISOString().split("T")[0] ||
    data.startTime !== booking.startTime ||
    data.endTime !== booking.endTime
  ) {
    const requestDate = new Date(data.date as string);
    const existingBookings = await findBookingsByBranchAndDate(data.branchId as string, requestDate);
    // filter out the current booking to avoid self-conflict
    const otherBookings = existingBookings.filter(b => b._id.toString() !== bookingId);
    if (!isSlotAvailable(data.date, data.startTime, data.endTime, otherBookings)) {
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
  }

  booking.branchId = data.branchId || booking.branchId;

  if (data.combo) {
    booking.comboId = data.combo;
    booking.serviceIds = null;
    booking.serviceType = BookingServiceType.COMBO;
  } else if (data.services && data.services.length > 0) {
    booking.serviceIds = data.services;
    booking.comboId = null;
    booking.serviceType = BookingServiceType.SPECIFIC_SERVICE;
  }

  const bookingDate = parseDateTimeFromDateAndTimeStr(data.date, data.startTime);
  if (!bookingDate) {
    return SendErrorResponse.badRequest({
      res,
      ...buildErrorPayload(
        req.originalUrl,
        functionName,
        req.method,
        "Invalid booking date",
        BAD_REQUEST,
        "Invalid booking date"
      )
    });
  }

  booking.bookingDate = bookingDate;
  booking.startTime = data.startTime;
  booking.endTime = data.endTime;
  booking.notes = data.customerInfo?.specialNotes || booking.notes || null;
  booking.totalPrice = updatedTotalPrice;
  booking.status = data.status;

  await booking.save();

  if (data.customerInfo) {
    const customer = await findCustomerById(booking.customerId);
    if (!customer) {
      return SendErrorResponse.notFound({
        res,
        ...buildErrorPayload(
          req.originalUrl,
          functionName,
          req.method,
          "Customer not found",
          DATA_NOT_FOUND,
          "Customer not found"
        )
      });
    }
    customer.firstName = data.customerInfo.firstName || customer.firstName;
    customer.lastName = data.customerInfo.lastName || customer.lastName;
    // Email and phone are ignored in booking edits per requirements
    customer.description = data.customerInfo.specialNotes || customer.description || "";
    await customer.save();
  }

  // Notify the customer of the change (a cancellation via edit gets the cancel email).
  await sendBookingChangeEmail(
    booking,
    booking.status === BookingStatus.CANCELLED ? "cancelled" : "updated"
  );

  invalidateBookingCaches(booking._id.toString());

  return SendResponse.success({
    res,
    message: "Booking updated successfully",
    data: {
      bookingId: booking._id.toString()
    }
  });
}
