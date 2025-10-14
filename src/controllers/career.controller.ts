import { Request, Response } from "express";
import { v4 as uuid } from "uuid";
import { isValidDate, parseDateTimeFromDateAndTimeStr, SendErrorResponse, SendResponse } from "../utils";
import { AddJobPostingType } from "../schemas";
import { ApplicationServices, CareerPostStatus, DATA_NOT_FOUND } from "../constants";
import { countAllCareerPosts, createCareerPost, findAllCareerPostsPaginated, findBranchesByIds } from "../services";

const buildErrorPayload = (
  endpoint: string,
  functionName: string,
  method: string,
  message: string,
  error: { code: string; message: string },
  customMsg: string
) => ({
  message,
  data: {
    clientError: { ...error, message: customMsg },
    endpoint,
    functionName,
    method,
    service: ApplicationServices.CAREER,
    id: uuid()
  }
});

export async function addJobPostingHandler(
  req: Request<Record<string, never>, Record<string, never>, AddJobPostingType>,
  res: Response
) {
  const functionName = addJobPostingHandler.name;
  const data = req.body;

  if (!isValidDate(data.applicationDeadline)) {
    return SendErrorResponse.badRequest({
      res,
      ...buildErrorPayload(
        req.originalUrl,
        functionName,
        req.method,
        "Invalid application deadline",
        DATA_NOT_FOUND,
        "Invalid application deadline"
      )
    });
  }

  const applicationDeadline = parseDateTimeFromDateAndTimeStr(data.applicationDeadline, "11:59 PM");
  if (!applicationDeadline) {
    return SendErrorResponse.badRequest({
      res,
      ...buildErrorPayload(
        req.originalUrl,
        functionName,
        req.method,
        "Invalid application deadline",
        DATA_NOT_FOUND,
        "Invalid application deadline"
      )
    });
  }

  const branches = await findBranchesByIds(data.branchIds);
  if (!branches || branches.length === 0) {
    return SendErrorResponse.badRequest({
      res,
      ...buildErrorPayload(
        req.originalUrl,
        functionName,
        req.method,
        "Branches not found",
        DATA_NOT_FOUND,
        "Branches not found"
      )
    });
  }

  const jobPost = await createCareerPost({
    branchesInfo: branches.map((b) => ({
      branchId: b._id.toString(),
      branchName: b.name
    })),
    jobTitle: data.jobTitle.trim(),
    department: data.department.trim(),
    employmentType: data.employmentType,
    showSalary: data.showSalary,
    minimumSalary: data.minimumSalary ?? null,
    maximumSalary: data.maximumSalary ?? null,
    currency: data.currency?.trim() || null,
    status: data.status,
    applicationDeadline,
    jobDescription: data.jobDescription.trim(),
    requirements: data.requirements.map((r) => r.trim()),
    benefits: data.benefits?.map((b) => b.trim()) || [],
    applications: [],
    postedAt: data.status === CareerPostStatus.ACTIVE ? new Date() : null
  });

  return SendResponse.success({
    res,
    message: "Job posting created successfully",
    data: {
      jobPost: {
        id: jobPost._id.toString()
      }
    }
  });
}

export async function getAllJobPostingsHandler(req: Request, res: Response) {
  // const functionName = getAllJobPostingsHandler.name;
  const page = parseInt((req.query.page as string) || "1", 10);
  const limit = parseInt((req.query.limit as string) || "10", 10);

  const jobPosts = await findAllCareerPostsPaginated(page, limit);
  const totalJobPosts = await countAllCareerPosts();

  const hasNext = page * limit < totalJobPosts;

  const formattedJobPosts = jobPosts.map((post) => ({
    id: post._id.toString(),
    jobTitle: post.jobTitle,
    department: post.department,
    employmentType: post.employmentType,
    jobDescription: post.jobDescription,
    applicationDeadline: post.applicationDeadline.toISOString().split("T")[0],
    status: post.status,
    branches: post.branchesInfo.map((b) => ({ id: b.branchId, name: b.branchName })),
    salary: post.showSalary
      ? { minimum: post.minimumSalary, maximum: post.maximumSalary, currency: post.currency }
      : null,
    numberOfApplications: post.applications.length,
    postedAt: post.postedAt ? post.postedAt.toISOString().split("T")[0] : null
  }));

  return SendResponse.success({
    res,
    message: "Job postings fetched successfully",
    data: {
      items: formattedJobPosts,
      currentPage: page,
      limit,
      totalItems: totalJobPosts,
      totalPages: Math.ceil(totalJobPosts / limit),
      hasNext
    }
  });
}
