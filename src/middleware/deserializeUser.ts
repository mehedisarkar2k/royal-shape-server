import { NextFunction, Request, Response } from "express";
import admin from "firebase-admin";
import { v4 as uuid } from "uuid";
import { SendErrorResponse, logger } from "../utils";
import { ApplicationServices, UNAUTHORIZED_ERROR, UNEXPECTED_ERROR } from "../constants";
import { captureErrorLog, findUserByEmailLeanFormat, findUserByPhoneLeanFormat, initializeFirebase } from "../services";

export const deserializeUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const functionName = deserializeUser.name;
  const accessToken = (req.headers.authorization || "").replace(/^Bearer\s/, "");

  try {
    if (!accessToken) {
      next();
      return;
    }

    if (req.originalUrl.includes("/login") || req.originalUrl.includes("/registration")) {
      return next();
    }

    if (!admin.apps.length) {
      logger.warn("Firebase admin app is not initialized. Initializing now...");
      await initializeFirebase();
    }

    const verifiedUser = await admin.auth().verifyIdToken(accessToken);
    if (!verifiedUser) {
      SendErrorResponse.unauthorized({
        res,
        message: "Unauthorized user! Access token is not valid.",
        data: {
          clientError: {
            ...UNAUTHORIZED_ERROR,
            message: "Unauthorized user! Access token is not valid."
          },
          endpoint: req.originalUrl,
          method: req.method.toUpperCase(),
          service: ApplicationServices.MIDDLEWARE,
          functionName,
          id: uuid()
        }
      });
      return;
    }

    let user = null;

    if (verifiedUser.firebase.sign_in_provider === "phone") {
      if (!verifiedUser.phone_number) {
        SendErrorResponse.unauthorized({
          res,
          message:
            "Unauthorized user! Auth provider is Phone but phone number is not accessible. Access token is not valid.",
          data: {
            clientError: {
              ...UNAUTHORIZED_ERROR,
              message: "Unauthorized user! Access token is not valid."
            },
            endpoint: req.originalUrl,
            method: req.method.toUpperCase(),
            service: ApplicationServices.MIDDLEWARE,
            functionName,
            id: uuid()
          }
        });
        return;
      }
      const userPhone = verifiedUser.phone_number;
      user = await findUserByPhoneLeanFormat(userPhone);
    } else {
      if (!verifiedUser.email) {
        // await captureErrorLog({});
        SendErrorResponse.unauthorized({
          res,
          message: `Unauthorized user! Auth provider is ${verifiedUser.firebase.sign_in_provider} but email is not accessible. Access token is not valid.`,
          data: {
            clientError: {
              ...UNAUTHORIZED_ERROR,
              message: "Unauthorized user! Access token is not valid."
            },
            endpoint: req.originalUrl,
            method: req.method.toUpperCase(),
            service: ApplicationServices.MIDDLEWARE,
            functionName,
            id: uuid()
          }
        });
        return;
      }
      const userEmail = verifiedUser.email;
      user = await findUserByEmailLeanFormat(userEmail);
    }

    if (!user) {
      await captureErrorLog({
        tags: ["deserializeUser Function", "Middleware", "Auth Issues", "Auth Token Issue"],
        message: `Invalid access token. Somehow the user is not found in the database. User email: ${verifiedUser.email}`,
        source: {
          functionName,
          service: ApplicationServices.MIDDLEWARE
        },
        errorDetails: {
          name: "Internal Server Error",
          code: "500"
        },
        metadata: {
          user: { firebaseUid: verifiedUser.uid, email: verifiedUser.email, phone: verifiedUser.phone_number }
        }
      });
      SendErrorResponse.unauthorized({
        res,
        message: `Invalid access token. Somehow the user is not found in the database. User email: ${verifiedUser.email}`,
        data: {
          clientError: UNAUTHORIZED_ERROR,
          endpoint: req.originalUrl,
          functionName,
          method: req.method.toUpperCase(),
          service: ApplicationServices.MIDDLEWARE,
          id: uuid()
        }
      });
      return;
    }

    res.locals.user = { ...user, _id: user._id.toString() };

    next();
    return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    // console.log(error.message);
    logger.error(`Error from Authorization Catch: ${error.message}`);

    // TODO: capture error in DB

    SendErrorResponse.internalServer({
      res,
      message: error.message,
      data: {
        clientError: UNEXPECTED_ERROR,
        endpoint: req.originalUrl,
        method: req.method,
        service: ApplicationServices.MIDDLEWARE,
        functionName,
        id: uuid()
      }
    });
    return;
  }
};
