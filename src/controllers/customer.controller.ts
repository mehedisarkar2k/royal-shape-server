import { Request, Response } from "express";
import { v4 as uuid } from "uuid";
import { CreateCustomerType } from "../schemas";
import { createCustomer, findCustomerByEmail, findAllCustomersPaginated, countAllCustomers } from "../services";
import { SendErrorResponse, SendResponse } from "../utils";
import { ApplicationServices, CONFLICT_ERROR } from "../constants";

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
  req: Request<Record<string, never>, Record<string, never>, CreateCustomerType>,
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

  const customers = await findAllCustomersPaginated(page, limit);
  const totalCustomers = await countAllCustomers();

  const hasNext = page * limit < totalCustomers;

  return SendResponse.success({
    res,
    message: "Fetched all customers successfully",
    data: {
      items: customers.map((customer) => ({ ...customer, id: customer._id.toString() })),
      currentPage: page,
      limit,
      totalItems: totalCustomers,
      totalPages: Math.ceil(totalCustomers / limit),
      hasNext
    }
  });
}
