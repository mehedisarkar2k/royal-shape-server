/* eslint-disable */

import { Request, Response } from "express";
import { SendResponse, SendErrorResponse, calculateAvailableSlots } from "../utils";
import { RequestBookingType } from "../schemas";
import { findBranchById } from "../services/branch.service";
import { findBookingsByBranchAndDate } from "../services/booking.service";
import { findServicesByIds } from "../services/business-service.service";

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

    // Parse serviceIds from query parameter
    const serviceIdArray = Array.isArray(serviceIds) ? (serviceIds as string[]) : (serviceIds as string).split(",");

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

  return SendResponse.success({
    res,
    message: "Booking requested successfully",
    data: {
      bookingId: "booking_12345"
    }
  });
}
