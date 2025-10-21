import { boolean, object, string, TypeOf } from "zod";

export const createPromotionSchema = object({
  body: object({
    title: string().min(1, "Title is required"),
    titleColor: string().min(1, "Title color is required"),
    description: string().min(1, "Description is required"),
    descriptionColor: string().min(1, "Description color is required"),
    bannerImage: string().min(1, "Banner image is required"),
    buttonText: string().min(1, "Button text is required"),
    buttonLink: string().min(1, "Button link is required"),
    buttonBgColor: string().min(1, "Button background color is required"),
    buttonTextColor: string().min(1, "Button text color is required"),
    isActive: boolean().optional()
  })
});
export type CreatePromotionType = TypeOf<typeof createPromotionSchema>["body"];
