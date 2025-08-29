/* eslint-disable */

import { Request, Response } from "express";
import { v4 as uuid } from "uuid";
import { ApplicationServices, FORBIDDEN_ERROR } from "../constants";
import { SendErrorResponse, SendResponse } from "../utils";
import {
  createService,
  createServiceCategory,
  findAllServiceCategories,
  findBranchesByIds,
  findServicesByCategoryId
} from "../services";
import { CreateServiceCategoryInput } from "../schemas";

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
    service: ApplicationServices.SERVICE,
    id: uuid()
  }
});

export async function createServiceCategoryHandler(
  req: Request<Record<string, never>, Record<string, never>, CreateServiceCategoryInput>,
  res: Response
) {
  const functionName = createServiceCategoryHandler.name;

  const { user } = res.locals;
  const data = req.body;

  if (user.userType !== "admin") {
    return SendErrorResponse.forbidden({
      res,
      ...buildErrorPayload(
        req.originalUrl,
        functionName,
        req.method,
        "User does not have permission to create service category",
        FORBIDDEN_ERROR,
        "You must be an admin to create a service category"
      )
    });
  }

  const branches = await findBranchesByIds(data.branchIds);
  if (branches.length !== data.branchIds.length) {
    return SendErrorResponse.badRequest({
      res,
      ...buildErrorPayload(
        req.originalUrl,
        functionName,
        req.method,
        "Some branch IDs are invalid",
        { code: "INVALID_BRANCH_ID", message: "One or more branch IDs are invalid" },
        "Please check the branch IDs and try again"
      )
    });
  }

  const newServiceCategory = await createServiceCategory({
    ...data,
    branches: branches.map((branch) => ({ branchId: branch._id.toString(), branchName: branch.name }))
  });

  return SendResponse.created({
    res,
    message: "Service category created successfully!",
    data: {
      id: newServiceCategory._id.toString()
    }
  });
}

export async function getAllServiceCategoriesHandler(req: Request, res: Response) {
  const serviceCategories = await findAllServiceCategories();

  return SendResponse.success({
    res,
    message: "Service categories retrieved successfully!",
    data: {
      serviceCategories: serviceCategories.map((category) => ({
        id: category._id.toString(),
        name: category.name
      }))
    }
  });
}

export async function getAllServicesWithCategoriesHandler(req: Request, res: Response) {
  const serviceCategories = await findAllServiceCategories();

  const servicesInfo = await Promise.all(
    serviceCategories.map(async (category) => {
      const s = await findServicesByCategoryId(category._id.toString());
      return {
        categoryId: category._id.toString(),
        categoryName: category.name,
        categoryDescription: category.description,
        categoryStatus: category.status,
        categoryBranches: category.branches,
        services: s.map((service) => ({
          id: service._id.toString(),
          name: service.name,
          description: service.description,
          duration: service.duration,
          price: service.price,
          currency: service.currency,
          status: service.status,
          branches: service.branches,
          numberOfBookings: 10 // TODO: Placeholder for number of bookings
        }))
      };
    })
  );

  return SendResponse.success({
    res,
    message: "Service categories retrieved successfully!",
    data: { servicesInfo }
  });
}

export async function updateServiceCategoryHandler(req: Request, res: Response) {
  // Handler logic for updating a service category
}

export async function deleteServiceCategoryHandler(req: Request, res: Response) {
  // Handler logic for deleting a service category
}

export async function createServiceHandler(req: Request, res: Response) {
  const functionName = createServiceHandler.name;

  const { user } = res.locals;
  const data = req.body;

  if (user.userType !== "admin") {
    return SendErrorResponse.forbidden({
      res,
      ...buildErrorPayload(
        req.originalUrl,
        functionName,
        req.method,
        "User does not have permission to create service",
        FORBIDDEN_ERROR,
        "You must be an admin to create a service"
      )
    });
  }

  const branches = await findBranchesByIds(data.branchIds);
  if (branches.length !== data.branchIds.length) {
    return SendErrorResponse.badRequest({
      res,
      ...buildErrorPayload(
        req.originalUrl,
        functionName,
        req.method,
        "Some branch IDs are invalid",
        { code: "INVALID_BRANCH_ID", message: "One or more branch IDs are invalid" },
        "Please check the branch IDs and try again"
      )
    });
  }

  const newService = await createService({
    ...data,
    branches: branches.map((branch) => ({ branchId: branch._id.toString(), branchName: branch.name }))
  });

  return SendResponse.created({
    res,
    message: "Service created successfully!",
    data: {
      id: newService._id.toString()
    }
  });
}

export async function updateServiceHandler(req: Request, res: Response) {
  // Handler logic for updating a service
}

export async function deleteServiceHandler(req: Request, res: Response) {
  // Handler logic for deleting a service
}
