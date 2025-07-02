import { object, string, TypeOf } from "zod";

export const contactFormSubmitSchema = object({
  body: object({
    name: string(),
    email: string(),
    phone: object({
      countryCode: string(),
      number: string()
    }),
    meetingType: string(),
    preferredDate: string(),
    message: string()
  })
});
export type ContactFormSubmitType = TypeOf<typeof contactFormSubmitSchema>["body"];
