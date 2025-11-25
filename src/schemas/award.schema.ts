import { object, string, TypeOf } from "zod";

export const createAwardSchema = object({
  body: object({
    title: string().min(3).max(100),
    issuer: string().min(3).max(100),
    year: string().min(4).max(4),
    description: string().min(10).max(500),
    badgeImage: string().url(),
    category: string().min(3).max(50)
  })
});
export type CreateAwardInput = TypeOf<typeof createAwardSchema>["body"];

export const updateAwardSchema = object({
  body: object({
    title: string().min(3).max(100).optional(),
    issuer: string().min(3).max(100).optional(),
    year: string().min(4).max(4).optional(),
    description: string().min(10).max(500).optional(),
    badgeImage: string().url().optional(),
    category: string().min(3).max(50).optional()
  })
});
export type UpdateAwardInput = TypeOf<typeof updateAwardSchema>["body"];
