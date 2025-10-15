import { array, boolean, nativeEnum, number, object, string, TypeOf } from "zod";
import { CareerPostStatus, EmploymentType } from "../constants";

export const addJobPostingSchema = object({
  body: object({
    jobTitle: string().min(1, "Job title is required"),
    department: string().min(1, "Department is required"),
    employmentType: nativeEnum(EmploymentType, { required_error: "Employment type is required" }),
    showSalary: boolean({ required_error: "Show salary is required" }),
    minimumSalary: number().optional().nullable(),
    maximumSalary: number().optional().nullable(),
    currency: string().optional().nullable(),
    status: nativeEnum(CareerPostStatus, { required_error: "Status is required" }),
    applicationDeadline: string().min(1, "Application deadline is required"),
    jobDescription: string().min(1, "Job description is required"),
    requirements: array(string().min(1, "Requirement item cannot be empty")).min(1, "Requirements are required"),
    benefits: array(string().min(1, "Benefit item cannot be empty")).optional().nullable(),
    branchIds: array(string().min(1, "Branch ID cannot be empty")).min(1, "At least one Branch is required")
  })
});

export type AddJobPostingType = TypeOf<typeof addJobPostingSchema>["body"];
