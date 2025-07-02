// TODO: activate this middleware when auth is implemented

// import { NextFunction, Request, Response } from "express";
// import { v4 as uuid } from "uuid";
// import { SendErrorResponse, stripPrivateFields, initFirebaseAdmin, logger } from "../utils";
// import { userPrivateFieldsForMiddleware } from "../model";
// import { ApplicationServices, UNEXPECTED_ERROR } from "../constants";
// import { findUserByEmail } from "../services";

// const deserializeUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
//   const functionName = deserializeUser.name;
//   const accessToken = (req.headers.authorization || "").replace(/^Bearer\s/, "");

//   try {
//     if (!accessToken) {
//       next();
//       return;
//     }
//     const firebaseAdmin = initFirebaseAdmin(); // TODO: initialize firebase when starting app
//     const verifiedUser = await firebaseAdmin.auth().verifyIdToken(accessToken);

//     const userEmail = verifiedUser.email as string;

//     const user = await findUserByEmail(userEmail);
//     if (!user) {
//       res.locals.user = null;
//       next();
//       return;
//     }

//     let formattedUser = stripPrivateFields(user, userPrivateFieldsForMiddleware);
//     formattedUser = { ...formattedUser, _id: formattedUser._id.toString() };
//     res.locals.user = formattedUser;

//     next();
//     return;

//     // eslint-disable-next-line @typescript-eslint/no-explicit-any
//   } catch (error: any) {
//     // console.log(error.message);
//     logger.error(`Error from Authorization Catch: ${error.message}`);

//     // TODO: capture error in DB

//     SendErrorResponse.internalServer({
//       res,
//       message: error.message,
//       data: {
//         clientError: UNEXPECTED_ERROR,
//         endpoint: req.originalUrl,
//         method: req.method,
//         service: ApplicationServices.MIDDLEWARE,
//         functionName,
//         id: uuid()
//       }
//     });
//     return;
//   }
// };

// export default deserializeUser;
