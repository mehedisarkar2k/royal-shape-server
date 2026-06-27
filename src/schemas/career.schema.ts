import { array, boolean, nativeEnum, number, object, string, TypeOf } from "zod";
import { CareerPostStatus, EmploymentType } from "../constants";
import { phoneSchema } from "./common.schema";

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
    keepOpen: boolean().optional().default(false),
    applicationDeadline: string().optional().nullable(),
    jobDescription: string().min(1, "Job description is required"),
    requirements: array(string().min(1, "Requirement item cannot be empty")).min(1, "Requirements are required"),
    benefits: array(string().min(1, "Benefit item cannot be empty")).optional().nullable(),
    responsibilities: array(string().min(1, "Responsibility item cannot be empty")).optional().nullable(),
    workingHours: string().optional().nullable(),
    startDate: string().optional().nullable(),
    branchIds: array(string().min(1, "Branch ID cannot be empty")).min(1, "At least one Branch is required")
  }).refine((data) => data.keepOpen || !!data.applicationDeadline, {
    message: "Application deadline is required unless the post is kept open",
    path: ["applicationDeadline"]
  })
});

export type AddJobPostingType = TypeOf<typeof addJobPostingSchema>["body"];

export const applyCareerPostSchema = object({
  body: object({
    applicantName: string().min(1, "Applicant name is required"),
    applicantEmail: string().min(1, "Applicant email is required").email("Invalid email address"),
    applicantPhone: phoneSchema,
    resumeUrl: string().min(1, "Resume is required"),
    coverLetter: string().optional().nullable()
  })
});
export type ApplyCareerPostType = TypeOf<typeof applyCareerPostSchema>["body"];
