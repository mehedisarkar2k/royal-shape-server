import { Request, Response } from "express";
import { v4 as uuid } from "uuid";
import { UpdateAuthenticatedCustomerType, UpdateCustomerType } from "../schemas";
import {
  createCustomer,
  findCustomerByEmail,
  countAllCustomers,
  findCustomerById,
  findAllCustomersWithBookingDetailsPaginated,
  deleteCustomerById,
  getCustomerBookingHistory,
  findServicesByIds,
  findComboById,
  findUserById
} from "../services";
import { SendErrorResponse, SendResponse } from "../utils";
import {
  ApplicationServices,
  CONFLICT_ERROR,
  DATA_NOT_FOUND,
  INPUT_MISSING,
  UNEXPECTED_ERROR,
  UserType
} from "../constants";
import { uploadFileR2WithAutoKey } from "../services/r2-storage.service";

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
        firstName: customer.firstName.trim(),
        lastName: (customer.lastName || "").trim(),
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
      firstName: customer.firstName.trim(),
      lastName: (customer.lastName || "").trim(),
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

export async function deleteCustomerHandler(req: Request<{ customerId: string }>, res: Response) {
  const functionName = deleteCustomerHandler.name;
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

  await deleteCustomerById(customerId);

  return SendResponse.success({
    res,
    message: "Customer deleted successfully",
    data: null
  });
}

export async function getCustomerBookingHistoryHandler(req: Request, res: Response) {
  const functionName = getCustomerBookingHistoryHandler.name;
  const user = res.locals.user;
  const page = parseInt((req.query.page as string) || "1", 10);
  const limit = parseInt((req.query.limit as string) || "20", 10);

  if (user.userType !== UserType.CUSTOMER) {
    return SendErrorResponse.unauthorized({
      res,
      ...buildErrorPayload(
        req.originalUrl,
        functionName,
        req.method,
        "This endpoint is only accessible to customers",
        DATA_NOT_FOUND,
        "You are not authorized to access this endpoint"
      )
    });
  }

  const customer = await findCustomerById(user._id);
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

  const bookings = await getCustomerBookingHistory(customer._id.toString(), page, limit);
  const finalBookings = await Promise.all(
    bookings.map(async (booking) => {
      let serviceNames = "";
      if (booking.serviceIds && booking.serviceIds.length > 0 && !booking.comboId) {
        const services = await findServicesByIds(booking.serviceIds);
        serviceNames = services.map((service) => service.name).join(", ");
      }
      const combo = await findComboById(booking.comboId as string);
      serviceNames = combo?.name || "Combo Service";

      return {
        id: booking._id.toString(),
        shortId: booking.shortId,
        branchId: booking.branchId,
        branchName: booking.branchName,
        service: serviceNames,
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
    message: "Fetched booking history successfully",
    data: {
      bookings: finalBookings
    }
  });
}

export async function getAuthenticatedSingleCustomerHandler(req: Request, res: Response) {
  const functionName = getAuthenticatedSingleCustomerHandler.name;
  const user = res.locals.user;

  if (user.userType !== UserType.CUSTOMER) {
    return SendErrorResponse.unauthorized({
      res,
      ...buildErrorPayload(
        req.originalUrl,
        functionName,
        req.method,
        "This endpoint is only accessible to customers",
        DATA_NOT_FOUND,
        "You are not authorized to access this customer portal"
      )
    });
  }

  const customer = await findCustomerByEmail(user.email);
  if (!customer) {
    return SendErrorResponse.notFound({
      res,
      ...buildErrorPayload(
        req.originalUrl,
        functionName,
        req.method,
        "Customer not found",
        DATA_NOT_FOUND,
        "Customer information not found"
      )
    });
  }

  return SendResponse.success({
    res,
    message: "Fetched customer information successfully",
    data: {
      customer: {
        userId: customer.userId,
        id: customer._id.toString(),
        firstName: customer.firstName,
        lastName: customer.lastName ?? "",
        profileImage: customer.profileImage ?? null,
        email: customer.email,
        description: customer.description ?? null,
        phone: customer.phone ?? null
      }
    }
  });
}

export async function updateAuthenticatedCustomerHandler(
  req: Request<Record<string, never>, Record<string, never>, UpdateAuthenticatedCustomerType>,
  res: Response
) {
  const functionName = updateAuthenticatedCustomerHandler.name;
  const currentUser = res.locals.user;
  const data = req.body;

  if (currentUser.userType !== UserType.CUSTOMER) {
    return SendErrorResponse.unauthorized({
      res,
      ...buildErrorPayload(
        req.originalUrl,
        functionName,
        req.method,
        "This endpoint is only accessible to customers",
        DATA_NOT_FOUND,
        "You are not authorized to access this customer portal"
      )
    });
  }

  const user = await findUserById(currentUser._id);
  if (!user) {
    return SendErrorResponse.notFound({
      res,
      ...buildErrorPayload(
        req.originalUrl,
        functionName,
        req.method,
        "User not found",
        DATA_NOT_FOUND,
        "User information not found"
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
        "Customer information not found"
      )
    });
  }

  if (data.firstName) {
    customer.firstName = data.firstName.trim();
    user.firstName = data.firstName.trim();
  }
  if (data.lastName !== undefined) {
    customer.lastName = data.lastName ? data.lastName.trim() : null;
    user.lastName = data.lastName ? data.lastName.trim() : null;
  }
  if (data.phone) {
    customer.phone = {
      countryCode: data.phone.countryCode.trim(),
      number: data.phone.number.trim(),
      e164: `+${data.phone.countryCode.trim()}${data.phone.number.trim()}`
    };
    user.phone = customer.phone;
  }
  if (data.profileImage !== undefined) {
    customer.profileImage = data.profileImage ? data.profileImage.trim() : null;
    user.profilePicture = customer.profileImage;
  }
  await customer.save();
  await user.save();

  return SendResponse.success({
    res,
    message: "Customer profile updated successfully",
    data: null
  });
}

export async function uploadAuthenticatedCustomerProfileImageHandler(req: Request, res: Response) {
  const functionName = uploadAuthenticatedCustomerProfileImageHandler.name;
  const { file } = req;
  if (!file) {
    return SendErrorResponse.badRequest({
      res,
      ...buildErrorPayload(
        req.originalUrl,
        functionName,
        req.method,
        "No image file uploaded",
        INPUT_MISSING,
        "No image file uploaded"
      )
    });
  }

  const filepath = file.path;

  const fileUploadRes = await uploadFileR2WithAutoKey(filepath, "customer-images", false);

  if (!fileUploadRes.success) {
    if (fileUploadRes.code === 404) {
      return SendErrorResponse.notFound({
        res,
        ...buildErrorPayload(
          req.originalUrl,
          functionName,
          req.method,
          fileUploadRes.message || "Image not found",
          DATA_NOT_FOUND,
          "Image not found"
        )
      });
    }

    return SendErrorResponse.internalServer({
      res,
      ...buildErrorPayload(
        req.originalUrl,
        functionName,
        req.method,
        fileUploadRes.message || "Image upload failed",
        UNEXPECTED_ERROR,
        "Image upload failed"
      )
    });
  }

  return SendResponse.success({
    res,
    message: "Image uploaded successfully",
    data: {
      url: fileUploadRes.publicUrl
    }
  });
}
