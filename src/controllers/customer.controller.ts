import { Request, Response } from "express";
import { v4 as uuid } from "uuid";
import { UpdateCustomerType } from "../schemas";
import {
  createCustomer,
  findCustomerByEmail,
  countAllCustomers,
  findCustomerById,
  findAllCustomersWithBookingDetailsPaginated
} from "../services";
import { SendErrorResponse, SendResponse } from "../utils";
import { ApplicationServices, CONFLICT_ERROR, DATA_NOT_FOUND } from "../constants";

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
    service: ApplicationServices.CUSTOMER,
    id: uuid()
  }
});

export async function createCustomerHandler(
  req: Request<Record<string, never>, Record<string, never>, UpdateCustomerType>,
  res: Response
) {
  const functionName = createCustomerHandler.name;
  const data = req.body;

  const customer = await findCustomerByEmail(data.email.toLowerCase());
  if (customer) {
    return SendErrorResponse.conflict({
      res,
      ...buildErrorPayload(
        req.originalUrl,
        functionName,
        req.method,
        "Customer already exists with this email",
        CONFLICT_ERROR,
        "Customer already exists with this email"
      )
    });
  }

  const newCustomer = await createCustomer({
    email: data.email.toLowerCase(),
    firstName: data.firstName.trim(),
    lastName: (data.lastName || "").trim(),
    phone: {
      countryCode: data.phone.countryCode.trim(),
      number: data.phone.number.trim(),
      e164: `+${data.phone.countryCode.trim()}${data.phone.number.trim()}`
    },
    description: (data.description || "").trim()
  });

  return SendResponse.success({
    res,
    message: "Customer created successfully",
    data: {
      customer: {
        id: newCustomer._id.toString()
      }
    }
  });
}

export async function getAllCustomersHandler(req: Request, res: Response) {
  const page = parseInt((req.query.page as string) || "1", 10);
  const limit = parseInt((req.query.limit as string) || "10", 10);

  const customerDetails = await findAllCustomersWithBookingDetailsPaginated(page, limit);
  const totalCustomers = await countAllCustomers();

  const hasNext = page * limit < totalCustomers;

  const formattedCustomers = customerDetails.map((customer) => {
    if (!customer.bookings || customer.bookings.length === 0) {
      return {
        id: customer._id.toString(),
        name: `${customer.firstName} ${customer.lastName || ""}`.trim(),
        email: customer.email,
        description: customer.description,
        phone: customer.phone,
        lastVisited: null,
        mostVisitedBranch: null,
        totalBookings: 0,
        totalSpent: 0
      };
    }
    const completedBookings = customer.bookings.filter((booking: { status: string }) => booking.status === "completed");
    const lastVisited =
      completedBookings.length > 0
        ? completedBookings
            .map((booking: { bookingDate: Date }) => new Date(booking.bookingDate))
            .sort((a: Date, b: Date) => b.getTime() - a.getTime())[0]
            .toISOString()
            .split("T")[0]
        : null;
    const mostVisitedBranch = customer.bookings.reduce(
      (acc: { [key: string]: number }, booking: { branchName: string }) => {
        acc[booking.branchName] = (acc[booking.branchName] || 0) + 1;
        return acc;
      },
      {}
    );
    const totalBookings = customer.bookings.length;
    const totalSpent =
      completedBookings.length > 0
        ? completedBookings.reduce((acc: number, booking: { totalPrice: number }) => acc + (booking.totalPrice || 0), 0)
        : 0;
    return {
      id: customer._id.toString(),
      name: `${customer.firstName} ${customer.lastName || ""}`.trim(),
      email: customer.email,
      description: customer.description,
      phone: customer.phone,
      lastVisited,
      mostVisitedBranch: Object.keys(mostVisitedBranch).reduce((a, b) =>
        mostVisitedBranch[a] > mostVisitedBranch[b] ? a : b
      ),
      totalBookings,
      totalSpent
    };
  });

  return SendResponse.success({
    res,
    message: "Fetched all customers successfully",
    data: {
      items: formattedCustomers,
      currentPage: page,
      limit,
      totalItems: totalCustomers,
      totalPages: Math.ceil(totalCustomers / limit),
      hasNext
    }
  });
}

export async function getSingleCustomerHandler(req: Request, res: Response) {
  const functionName = getSingleCustomerHandler.name;
  const { customerId } = req.params;

  const customer = await findCustomerById(customerId);
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

  return SendResponse.success({
    res,
    message: "Fetched customer successfully",
    data: {
      customer: {
        id: customer._id.toString(),
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        description: customer.description,
        phone: customer.phone
      }
    }
  });
}

export async function updateCustomerHandler(
  req: Request<{ customerId: string }, Record<string, never>, UpdateCustomerType>,
  res: Response
) {
  const functionName = updateCustomerHandler.name;
  const { customerId } = req.params;
  const data = req.body;

  const customer = await findCustomerById(customerId);
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

  // * don't allow updating email and phone for now

  customer.firstName = data.firstName.trim();
  customer.lastName = (data.lastName || "").trim();
  customer.description = (data.description || "").trim();

  await customer.save();

  return SendResponse.success({
    res,
    message: "Customer updated successfully",
    data: {
      customer: {
        id: customer._id.toString()
      }
    }
  });
}
