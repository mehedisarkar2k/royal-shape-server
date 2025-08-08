import { object, string, TypeOf } from "zod";
import { phoneSchema } from "./common.schema";

export const adminLoginSchema = object({
  body: object({
    email: string({ required_error: "Email is required" }).email()
  })
});
export type AdminLoginType = TypeOf<typeof adminLoginSchema>["body"];

export const customerLoginSchema = object({
  body: object({
    fullName: string().optional().nullable(),
    email: string().email().optional().nullable(),
    phone: phoneSchema.optional().nullable()
  })
});
export type CustomerLoginType = TypeOf<typeof customerLoginSchema>["body"];
