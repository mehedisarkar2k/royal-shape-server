/* eslint-disable */

import { Request, Response } from "express";
import { v4 as uuid } from "uuid";
import { ApplicationServices, DATA_NOT_FOUND, FORBIDDEN_ERROR } from "../constants";
import { SendErrorResponse, SendResponse, appCache, clearCacheByPrefix } from "../utils";
import {
  countServiceCategories,
  countServicesOfCategory,
  createService,
  createServiceCategory,
  deleteServiceById,
  deleteServiceCategoryById,
  deleteServicesByCategoryId,
  findAllServiceCategories,
  findAllServiceCategoriesPaginated,
  findBranchesByIds,
  findServiceById,
  findServiceCategoryById,
  findServicesByCategoryId
} from "../services";
import { CreateServiceCategoryInput, CreateServiceInput } from "../schemas";
import c from "config";

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

/** Drops every cached website response that surfaces services/categories. */
const invalidateServiceCaches = () => {
  appCache.del("website_home_data");
  appCache.del("website_pricing_page_data");
  appCache.del("website_services_page_data");
  clearCacheByPrefix("website_branch_services_data_");
  clearCacheByPrefix("website_single_service_data_");
};

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

  invalidateServiceCaches();

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

export async function updateServiceCategoryHandler(
  req: Request<{ id: string }, Record<string, never>, CreateServiceCategoryInput>,
  res: Response
) {
  const functionName = updateServiceCategoryHandler.name;
  const data = req.body;

  const { id } = req.params;

  const serviceCategory = await findServiceCategoryById(id);
  if (!serviceCategory) {
    return SendErrorResponse.notFound({
      res,
      ...buildErrorPayload(
        req.originalUrl,
        functionName,
        req.method,
        "Service category not found",
        DATA_NOT_FOUND,
        "Service category not found"
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
        DATA_NOT_FOUND,
        "Please check the branch IDs and try again"
      )
    });
  }

  serviceCategory.name = data.name.trim() || serviceCategory.name;
  serviceCategory.description = data.description?.trim() || serviceCategory.description;
  serviceCategory.status = data.status || serviceCategory.status;
  serviceCategory.thumbnail = data.thumbnail || serviceCategory.thumbnail;
  serviceCategory.displayOrder = data.displayOrder ?? serviceCategory.displayOrder;
  serviceCategory.branches = branches.map((branch) => ({ branchId: branch._id.toString(), branchName: branch.name }));

  await serviceCategory.save();

  invalidateServiceCaches();

  return SendResponse.success({
    res,
    message: "Service category updated successfully!",
    data: {
      id: serviceCategory._id.toString()
    }
  });
}

export async function deleteServiceCategoryHandler(req: Request, res: Response) {
  const functionName = deleteServiceCategoryHandler.name;
  const { id } = req.params;

  const serviceCategory = await findServiceCategoryById(id);
  if (!serviceCategory) {
    return SendErrorResponse.notFound({
      res,
      ...buildErrorPayload(
        req.originalUrl,
        functionName,
        req.method,
        "Service category not found",
        DATA_NOT_FOUND,
        "Service category not found"
      )
    });
  }

  // * delete services of this category
  await deleteServicesByCategoryId(id);

  // * delete the category
  await deleteServiceCategoryById(id);

  invalidateServiceCaches();

  return SendResponse.success({
    res,
    message: "Service category and its services deleted successfully!",
    data: null
  });
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

  invalidateServiceCaches();

  return SendResponse.created({
    res,
    message: "Service created successfully!",
    data: {
      id: newService._id.toString()
    }
  });
}

export async function updateServiceHandler(
  req: Request<{ id: string }, Record<string, never>, CreateServiceInput>,
  res: Response
) {
  const functionName = updateServiceHandler.name;
  const data = req.body;
  const { id } = req.params;

  const service = await findServiceById(id);
  if (!service) {
    return SendErrorResponse.notFound({
      res,
      ...buildErrorPayload(
        req.originalUrl,
        functionName,
        req.method,
        "Service not found",
        DATA_NOT_FOUND,
        "Service not found"
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
        DATA_NOT_FOUND,
        "Please check the branch IDs and try again"
      )
    });
  }

  service.name = data.name.trim() || service.name;
  service.description = data.description?.trim() || service.description;
  service.categoryId = data.categoryId || service.categoryId;
  service.duration = data.duration || service.duration;
  service.price = data.price || service.price;
  service.currency = data.currency || service.currency;
  service.status = data.status || service.status;
  service.thumbnail = data.thumbnail || service.thumbnail;
  service.branches = branches.map((branch) => ({ branchId: branch._id.toString(), branchName: branch.name }));

  await service.save();

  invalidateServiceCaches();

  return SendResponse.success({
    res,
    message: "Service updated successfully!",
    data: {
      id: service._id.toString()
    }
  });
}

export async function deleteServiceHandler(req: Request, res: Response) {
  const functionName = deleteServiceHandler.name;
  const { id } = req.params;

  const service = await findServiceById(id);
  if (!service) {
    return SendErrorResponse.notFound({
      res,
      ...buildErrorPayload(
        req.originalUrl,
        functionName,
        req.method,
        "Service not found",
        DATA_NOT_FOUND,
        "Service not found"
      )
    });
  }

  await deleteServiceById(id);

  invalidateServiceCaches();

  return SendResponse.success({
    res,
    message: "Service deleted successfully!",
    data: null
  });
}

export async function getAllServiceCategoriesWithDetailsHandler(req: Request, res: Response) {
  const functionName = getAllServiceCategoriesWithDetailsHandler.name;
  const page = parseInt((req.query.page as string) || "1", 10);
  const limit = parseInt((req.query.limit as string) || "10", 10);

  const serviceCategories = await findAllServiceCategoriesPaginated(page, limit);
  const totalCategories = await countServiceCategories();
  const hasNext = page * limit < totalCategories;

  const detailedCategories = await Promise.all(
    serviceCategories.map(async (category) => {
      const servicesCount = await countServicesOfCategory(category._id.toString());
      return {
        id: category._id.toString(),
        name: category.name,
        description: category.description || "",
        branches: category.branches.map((b) => ({
          id: b.branchId,
          name: b.branchName
        })),
        status: category.status,
        thumbnail: category.thumbnail || null,
        displayOrder: category.displayOrder ?? 0,
        numberOfServices: servicesCount
      };
    })
  );

  return SendResponse.success({
    res,
    message: "Service categories retrieved successfully!",
    data: {
      items: detailedCategories,
      currentPage: page,
      limit,
      totalItems: totalCategories,
      totalPages: Math.ceil(totalCategories / limit),
      hasNext
    }
  });
}

export async function getAllServicesOfCategoryHandler(req: Request, res: Response) {
  // const functionName = getAllServicesOfCategoryHandler.name;
  const { categoryId } = req.params;

  const services = await findServicesByCategoryId(categoryId);

  const formattedServices = services.map((service) => ({
    id: service._id.toString(),
    name: service.name,
    description: service.description || "",
    duration: service.duration,
    price: service.price,
    currency: service.currency || "AUD",
    thumbnail: service.thumbnail || null,
    branches: service.branches.map((b) => ({
      id: b.branchId,
      name: b.branchName
    })),
    status: service.status
  }));

  return SendResponse.success({
    res,
    message: "Services retrieved successfully!",
    data: {
      items: formattedServices
    }
  });
}

export async function getSingleServiceCategoryHandler(req: Request, res: Response) {
  const functionName = getSingleServiceCategoryHandler.name;
  const { id } = req.params;

  const category = await findServiceCategoryById(id);
  if (!category) {
    return SendErrorResponse.notFound({
      res,
      ...buildErrorPayload(
        req.originalUrl,
        functionName,
        req.method,
        "Service category not found",
        DATA_NOT_FOUND,
        "Service category not found"
      )
    });
  }

  return SendResponse.success({
    res,
    message: "Service category retrieved successfully!",
    data: {
      id: category._id.toString(),
      name: category.name,
      description: category.description || "",
      branches: category.branches.map((b) => ({
        id: b.branchId,
        name: b.branchName
      })),
      status: category.status,
      thumbnail: category.thumbnail || null,
      displayOrder: category.displayOrder ?? 0
    }
  });
}

export async function getSingleServiceHandler(req: Request, res: Response) {
  const functionName = getSingleServiceHandler.name;
  const { id } = req.params;

  const service = await findServiceById(id);
  if (!service) {
    return SendErrorResponse.notFound({
      res,
      ...buildErrorPayload(
        req.originalUrl,
        functionName,
        req.method,
        "Service not found",
        DATA_NOT_FOUND,
        "Service not found"
      )
    });
  }

  const category = await findServiceCategoryById(service.categoryId);
  if (!category) {
    return SendErrorResponse.notFound({
      res,
      ...buildErrorPayload(
        req.originalUrl,
        functionName,
        req.method,
        "Service category not found",
        DATA_NOT_FOUND,
        "Service category not found"
      )
    });
  }

  return SendResponse.success({
    res,
    message: "Service retrieved successfully!",
    data: {
      category: {
        id: category._id.toString(),
        name: category.name
      },
      id: service._id.toString(),
      name: service.name,
      description: service.description || "",
      duration: service.duration,
      price: service.price,
      currency: service.currency || "AUD",
      status: service.status,
      thumbnail: service.thumbnail || null,
      branches: service.branches.map((b) => ({
        id: b.branchId,
        name: b.branchName
      }))
    }
  });
}
