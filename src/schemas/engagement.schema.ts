import { number, object, string, TypeOf } from "zod";

export const submitReviewSchema = object({
  body: object({
    customerName: string().min(1, "Customer name is required"),
    customerEmail: string().email("Invalid email address").optional(),
    customerImage: string().optional(),
    rating: number().min(1, "Rating must be at least 1").max(5, "Rating must be at most 5"),
    comment: string().min(1, "Comment is required")
  })
});
export type SubmitReviewInput = TypeOf<typeof submitReviewSchema>["body"];

export const contactFormSubmitSchema = object({
  body: object({
    name: string().min(1, "Name is required"),
    email: string().min(1).email("Invalid email"),
    topic: string().min(1, "Topic is required"),
    message: string().min(1, "Message is required")
  })
});
export type ContactFormSubmitType = TypeOf<typeof contactFormSubmitSchema>["body"];

export const subscribeSchema = object({
  body: object({
    email: string({ required_error: "Email is required" }).email("Invalid email address")
  })
});
export type SubscribeInput = TypeOf<typeof subscribeSchema>["body"];

export const sendCampaignSchema = object({
  body: object({
    subject: string({ required_error: "Subject is required" }).min(1, "Subject is required"),
    html: string({ required_error: "Content is required" }).min(1, "Content is required")
  })
});
export type SendCampaignInput = TypeOf<typeof sendCampaignSchema>["body"];
