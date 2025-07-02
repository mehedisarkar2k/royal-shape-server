import { object, string } from "zod";

export const phoneSchema = object({
  countryCode: string({
    required_error: "Country code is required"
  }).min(1, "Country code must be at least 1 character long"),
  number: string({
    required_error: "Phone number is required"
  }).min(5, "Phone number must be at least 5 characters long")
});

export const addressSchema = object({
  addressLine1: string({
    required_error: "Address Line 1 is required"
  }),
  addressLine2: string().optional(),
  country: string({
    required_error: "Country is required"
  }),
  city: string({
    required_error: "City is required"
  }),
  state: string({
    required_error: "State is required"
  }),
  zipCode: string({
    required_error: "Zip code is required"
  }).min(4, "Zip code must be at least 4 characters long")
});
