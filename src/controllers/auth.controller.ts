import { Request, Response } from "express";
import admin from "firebase-admin";
import { v4 as uuid } from "uuid";
import { AdminLoginType, CustomerLoginType } from "../schemas";
import { createCustomer, createUser, findCustomerByEmail, findUserByEmail, findUserByPhone } from "../services";
import { SendErrorResponse, SendResponse } from "../utils";
import { ApplicationServices, BAD_REQUEST, DATA_NOT_FOUND, INPUT_MISSING, UNAUTHORIZED_ERROR } from "../constants";

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
    service: ApplicationServices.AUTHENTICATION,
    id: uuid()
  }
});

export const adminLoginHandler = async (
  req: Request<Record<string, never>, Record<string, never>, AdminLoginType>,
  res: Response
) => {
  const functionName = adminLoginHandler.name;
  const accessToken = (req.headers.authorization || "").replace(/^Bearer\s/, "");
  const { email } = req.body;

  if (!accessToken) {
    return SendErrorResponse.unauthorized({
      res,
      ...buildErrorPayload(
        req.originalUrl,
        functionName,
        req.method,
        "Access token is missing",
        UNAUTHORIZED_ERROR,
        "Access token is required for authentication"
      )
    });
  }

  const verifiedUser = await admin.auth().verifyIdToken(accessToken);
  if (!verifiedUser) {
    return SendErrorResponse.unauthorized({
      res,
      ...buildErrorPayload(
        req.originalUrl,
        functionName,
        req.method,
        "Unauthorized user! Access token is not valid.",
        UNAUTHORIZED_ERROR,
        "Unauthorized user! Access token is not valid."
      )
    });
  }

  if (email !== verifiedUser.email) {
    return SendErrorResponse.badRequest({
      res,
      ...buildErrorPayload(
        req.originalUrl,
        functionName,
        req.method,
        "Email mismatch",
        BAD_REQUEST,
        "The email provided does not match the email in the access token"
      )
    });
  }

  const user = await findUserByEmail(email);
  if (!user) {
    return SendErrorResponse.notFound({
      res,
      ...buildErrorPayload(
        req.originalUrl,
        functionName,
        req.method,
        "User not found",
        DATA_NOT_FOUND,
        "No user found with the provided email"
      )
    });
  }

  if (user.userType !== "admin") {
    return SendErrorResponse.unauthorized({
      res,
      ...buildErrorPayload(
        req.originalUrl,
        functionName,
        req.method,
        "User is not an admin",
        UNAUTHORIZED_ERROR,
        "This account does not have admin access"
      )
    });
  }

  return SendResponse.success({
    res,
    message: "User logged in successfully",
    data: {
      user: {
        id: user._id.toString(),
        email: user.email,
        firstName: user.firstName,
        userType: user.userType,
        role: user.role
      }
    }
  });
};

export const customerLoginHandler = async (
  req: Request<Record<string, never>, Record<string, never>, CustomerLoginType>,
  res: Response
) => {
  const functionName = customerLoginHandler.name;
  const accessToken = (req.headers.authorization || "").replace(/^Bearer\s/, "");
  const { fullName, email, phone } = req.body;

  if (!accessToken) {
    return SendErrorResponse.unauthorized({
      res,
      ...buildErrorPayload(
        req.originalUrl,
        functionName,
        req.method,
        "Access token is missing",
        UNAUTHORIZED_ERROR,
        "Access token is required for authentication"
      )
    });
  }

  const verifiedUser = await admin.auth().verifyIdToken(accessToken);
  if (!verifiedUser) {
    return SendErrorResponse.unauthorized({
      res,
      ...buildErrorPayload(
        req.originalUrl,
        functionName,
        req.method,
        "Invalid access token",
        UNAUTHORIZED_ERROR,
        "The provided access token is not valid"
      )
    });
  }

  if (!email && !phone) {
    return SendErrorResponse.badRequest({
      res,
      ...buildErrorPayload(
        req.originalUrl,
        functionName,
        req.method,
        "Invalid login data",
        INPUT_MISSING,
        "Please provide either an email or a phone number to log in"
      )
    });
  }

  let user = null;

  if (email) {
    if (verifiedUser.email !== email) {
      return SendErrorResponse.badRequest({
        res,
        ...buildErrorPayload(
          req.originalUrl,
          functionName,
          req.method,
          "Input email is not matching with the requested user's email.",
          BAD_REQUEST,
          "The email provided does not match the email in the access token"
        )
      });
    }
    user = await findUserByEmail(email);
  } else if (phone) {
    if (verifiedUser.phone_number !== `${phone.countryCode}${phone.number}`.trim()) {
      return SendErrorResponse.badRequest({
        res,
        ...buildErrorPayload(
          req.originalUrl,
          functionName,
          req.method,
          "Input phone number is not matching with the requested user's phone number.",
          BAD_REQUEST,
          "The phone number provided does not match the phone number in the access token"
        )
      });
    }
    user = await findUserByPhone(`${phone.countryCode}${phone.number}`.trim());
  }

  if (!user) {
    const newUser = await createUser({
      // * last name is optional and can be null. if no last portion of fullname that is no space then no last name that is null. But if there is one or more spaces then last name is the last portion of fullname and first name is the portion before the last space
      firstName: fullName ? fullName.split(" ").slice(0, -1).join(" ") : email?.split("@")[0] || "New User",
      lastName: fullName ? fullName.split(" ").slice(-1).join(" ") : null,
      email: email || null,
      phone: phone
        ? { countryCode: phone.countryCode, number: phone.number, e164: `${phone.countryCode}${phone.number}`.trim() }
        : null,
      userType: "customer",
      role: "customer"
    });

    const alreadyExistingCustomer = await findCustomerByEmail(newUser.email as string);
    if (alreadyExistingCustomer) {
      return SendResponse.success({
        res,
        message: "User logged in successfully",
        data: {
          user: {
            id: newUser._id.toString(),
            customerId: alreadyExistingCustomer._id.toString(),
            email: newUser.email,
            phone: newUser.phone,
            firstName: newUser.firstName,
            userType: newUser.userType,
            role: newUser.role
          }
        }
      });
    }

    const customerProfile = await createCustomer({
      userId: newUser._id.toString(),
      firstName: newUser.firstName,
      lastName: newUser.lastName || null,
      email: newUser.email || null,
      phone: newUser.phone || null,
      description: null,
      profileImage: null
    });
    if (!customerProfile) {
      return SendErrorResponse.internalServer({
        res,
        ...buildErrorPayload(
          req.originalUrl,
          functionName,
          req.method,
          "Failed to create customer profile",
          BAD_REQUEST,
          "An error occurred while creating the customer profile"
        )
      });
    }

    return SendResponse.success({
      res,
      message: "User logged in successfully",
      data: {
        user: {
          id: newUser._id.toString(),
          customerId: customerProfile._id.toString(),
          email: newUser.email,
          phone: newUser.phone,
          firstName: newUser.firstName,
          userType: newUser.userType,
          role: newUser.role
        }
      }
    });
  }

  // User exists, proceed to login
  const alreadyExistingCustomer = await findCustomerByEmail(user.email as string);
  if (alreadyExistingCustomer) {
    return SendResponse.success({
      res,
      message: "User logged in successfully",
      data: {
        user: {
          id: user._id.toString(),
          customerId: alreadyExistingCustomer._id.toString(),
          email: user.email,
          phone: user.phone,
          firstName: user.firstName,
          userType: user.userType,
          role: user.role
        }
      }
    });
  }

  const customerProfile = await createCustomer({
    userId: user._id.toString(),
    firstName: user.firstName,
    lastName: user.lastName || null,
    email: user.email || null,
    phone: user.phone || null,
    description: null,
    profileImage: user.profilePicture || null
  });
  if (!customerProfile) {
    return SendErrorResponse.internalServer({
      res,
      ...buildErrorPayload(
        req.originalUrl,
        functionName,
        req.method,
        "Failed to create customer profile",
        BAD_REQUEST,
        "An error occurred while creating the customer profile"
      )
    });
  }

  return SendResponse.success({
    res,
    message: "User logged in successfully",
    data: {
      user: {
        id: user._id.toString(),
        customerId: customerProfile._id.toString(),
        email: user.email,
        phone: user.phone,
        firstName: user.firstName,
        userType: user.userType,
        role: user.role
      }
    }
  });
};
