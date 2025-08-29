import { array, nativeEnum, number, object, string, TypeOf } from "zod";
import { ServiceStatus } from "../constants";

export const createServiceCategorySchema = object({
  body: object({
    name: string({
      required_error: "Service category name is required"
    }),
    description: string().optional().nullable(),
    branchIds: array(string()).nonempty({
      message: "At least one branch ID is required"
    }),
    status: nativeEnum(ServiceStatus, {
      required_error: "Service category status is required"
    }),
    thumbnail: string({
      required_error: "Service category thumbnail is required"
    })
  })
});
export type CreateServiceCategoryInput = TypeOf<typeof createServiceCategorySchema>["body"];

export const createServiceSchema = object({
  body: object({
    name: string({
      required_error: "Service name is required"
    }),
    description: string().optional().nullable(),
    categoryId: string({
      required_error: "Service category ID is required"
    }),
    duration: string({
      required_error: "Service duration is required"
    }),
    price: number({
      required_error: "Service price is required"
    }).min(0, {
      message: "Service price must be a positive number"
    }),
    currency: string().optional(),
    thumbnail: string().optional().nullable(),
    branchIds: array(string()).nonempty({
      message: "At least one branch ID is required"
    }),
    status: nativeEnum(ServiceStatus, {
      required_error: "Service status is required"
    })
  })
});
export type CreateServiceInput = TypeOf<typeof createServiceSchema>["body"];
