import { array, boolean, number, object, string, TypeOf } from "zod";

export const createComboSchema = object({
  body: object({
    name: string().min(1, "Combo name is required"),
    description: string().min(1, "Combo description is required"),
    totalPrice: number().min(1, "Total price must be at least 1 AUD"),
    duration: string().min(1, "Duration is required"),
    comboItems: array(string().min(1, "Each combo item must be a valid string")).min(
      1,
      "At least one combo item is required"
    ),
    branchIds: array(string().min(1, "Each branch ID must be a valid string")).min(
      1,
      "At least one branch ID is required"
    ),
    // Quick / limited-time offering (optional).
    isQuickOffering: boolean().optional(),
    expiresAt: string().datetime().optional().nullable()
  })
});
export type CreateComboInput = TypeOf<typeof createComboSchema>["body"];
