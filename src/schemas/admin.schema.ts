import { object, TypeOf } from "zod";

export const postWebsiteHomeDataSchema = object({
  body: object({})
});
export type PostWebsiteHomeDataType = TypeOf<typeof postWebsiteHomeDataSchema>["body"];

export const postWebsiteServiceDataSchema = object({
  body: object({})
});
export type PostWebsiteServiceDataType = TypeOf<typeof postWebsiteServiceDataSchema>["body"];

export const postWebsiteAboutDataSchema = object({
  body: object({})
});
export type PostWebsiteAboutDataType = TypeOf<typeof postWebsiteAboutDataSchema>["body"];
