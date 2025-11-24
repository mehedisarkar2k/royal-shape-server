import { object, string, TypeOf } from "zod";
import { phoneSchema } from "./common.schema";

export const createCustomerSchema = object({
  body: object({
    firstName: string().min(1, "First name is required"),
    lastName: string().optional().nullable(),
    email: string().email("Invalid email"),
    phone: phoneSchema,
    description: string().optional().nullable()
  })
});
export type CreateCustomerType = TypeOf<typeof createCustomerSchema>["body"];

export const updateCustomerSchema = object({
  body: object({
    firstName: string().min(1, "First name is required"),
    lastName: string().optional().nullable(),
    email: string().email("Invalid email"),
    phone: phoneSchema,
    description: string().optional().nullable()
  })
});
export type UpdateCustomerType = TypeOf<typeof updateCustomerSchema>["body"];

export const updateAuthenticatedCustomerSchema = object({
  body: object({
    firstName: string().min(1, "First name is required").optional(),
    lastName: string().optional().nullable(),
    phone: phoneSchema.optional().nullable(),
    profileImage: string().optional().nullable()
  })
});
export type UpdateAuthenticatedCustomerType = TypeOf<typeof updateAuthenticatedCustomerSchema>["body"];
