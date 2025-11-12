import { nativeEnum, number, object, string, TypeOf } from "zod";
import { addressSchema, phoneSchema } from "./common.schema";
import { BranchStatus } from "../constants";

const openingHour = object({
  open: string({ required_error: "Open time is required!" }),
  close: string({ required_error: "Close time is required!" })
});

export const createBranchSchema = object({
  body: object({
    name: string({ required_error: "Name is required!" })
      .min(1, "Name is required")
      .max(100, "Name must be less than 100 characters!"),
    phone: phoneSchema,
    email: string({ required_error: "Email is required!" }).email("Invalid email format"),
    address: addressSchema,
    managerName: string({ required_error: "Manager name is required!" })
      .min(1, "Manager name is required")
      .max(100, "Manager name must be less than 100 characters!"),
    status: nativeEnum(BranchStatus, { required_error: "Status is required!" }),
    weeklySchedule: object({
      monday: openingHour,
      tuesday: openingHour,
      wednesday: openingHour,
      thursday: openingHour,
      friday: openingHour,
      saturday: openingHour,
      sunday: openingHour
    }),
    establishedYear: string().optional().nullable(),
    description: string().optional().nullable(),
    latitude: number({ required_error: "Latitude is required!" }),
    longitude: number({ required_error: "Longitude is required!" })
  })
});

export type CreateBranchType = TypeOf<typeof createBranchSchema>["body"];
