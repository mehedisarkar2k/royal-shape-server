import { NextFunction, Request, Response } from "express";
import { v4 as uuid } from "uuid";
import { SendErrorResponse } from "../utils";
import { ApplicationServices, UNAUTHORIZED_ERROR } from "../constants";

const requireRole = (roles: string | string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const functionName = requireRole.name;
    const { user } = res.locals;

    if (!user) {
      return next(); // Let requireUser handle this if it's placed before requireRole
    }

    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    if (!allowedRoles.includes(user.userType)) {
      SendErrorResponse.unauthorized({
        res,
        message: `Unauthorized! Requires one of the following roles: ${allowedRoles.join(", ")}.`,
        data: {
          clientError: {
            ...UNAUTHORIZED_ERROR,
            message: "You do not have permission to perform this action."
          },
          endpoint: req.originalUrl,
          method: req.method,
          service: ApplicationServices.MIDDLEWARE,
          functionName,
          id: uuid()
        }
      });
      return;
    }

    return next();
  };
};

export default requireRole;
