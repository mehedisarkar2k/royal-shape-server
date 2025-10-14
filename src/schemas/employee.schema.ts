import { object, string, TypeOf } from "zod";
import { phoneSchema } from "./common.schema";

export const addEmployeeSchema = object({
  body: object({
    name: string({
      required_error: "Name is required"
    }),
    email: string({
      required_error: "Email is required"
    }).email("Not a valid email"),
    jobRole: string({
      required_error: "Job role is required"
    }),
    phoneNumber: phoneSchema,
    department: string().optional().nullable(),
    branchId: string({
      required_error: "Branch ID is required"
    }),
    address: string().optional().nullable(),
    profileImage: string().optional().nullable()
  })
});
export type AddEmployeeInput = TypeOf<typeof addEmployeeSchema>["body"];
