import { Request, Response } from "express";
import { v4 as uuid } from "uuid";
import { isValidDate, parseDateTimeFromDateAndTimeStr, SendErrorResponse, SendResponse } from "../utils";
import { AddJobPostingType, ApplyCareerPostType } from "../schemas";
import { ApplicationServices, CareerPostStatus, DATA_NOT_FOUND } from "../constants";
import {
  countAllCareerPosts,
  countAllPublicCareerPosts,
  createCareerPost,
  deleteCareerPostById,
  findAllCareerPostsPaginated,
  findAllPublicCareerPostsPaginated,
  findBranchesByIds,
  findCareerPostById,
  findPublicCareerPostById
} from "../services";

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

  let applicationDeadline: Date | null = null;
  if (!data.keepOpen) {
    if (!data.applicationDeadline || !isValidDate(data.applicationDeadline)) {
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

    applicationDeadline = parseDateTimeFromDateAndTimeStr(data.applicationDeadline, "11:59 PM");
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
    keepOpen: data.keepOpen ?? false,
    applicationDeadline,
    jobDescription: data.jobDescription.trim(),
    requirements: data.requirements.map((r) => r.trim()),
    benefits: data.benefits?.map((b) => b.trim()) || [],
    responsibilities: data.responsibilities?.map((r) => r.trim()) || [],
    workingHours: data.workingHours?.trim() || null,
    startDate: data.startDate?.trim() || null,
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
    applicationDeadline: post.applicationDeadline ? post.applicationDeadline.toISOString().split("T")[0] : null,
    keepOpen: post.keepOpen,
    status: post.status,
    branches: post.branchesInfo.map((b) => ({ id: b.branchId, name: b.branchName })),
    salary: post.showSalary
      ? { minimum: post.minimumSalary, maximum: post.maximumSalary, currency: post.currency }
      : null,
    workingHours: post.workingHours,
    startDate: post.startDate,
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

export async function getSingleJobPostingHandler(req: Request, res: Response) {
  const functionName = getSingleJobPostingHandler.name;
  const { id } = req.params;

  const jobPost = await findCareerPostById(id);
  if (!jobPost) {
    return SendErrorResponse.notFound({
      res,
      ...buildErrorPayload(
        req.originalUrl,
        functionName,
        req.method,
        "Job posting not found",
        DATA_NOT_FOUND,
        "Job posting not found"
      )
    });
  }

  const formattedJobPost = {
    id: jobPost._id.toString(),
    jobTitle: jobPost.jobTitle,
    department: jobPost.department,
    employmentType: jobPost.employmentType,
    showSalary: jobPost.showSalary,
    salary: jobPost.showSalary
      ? {
          minimum: jobPost.minimumSalary,
          maximum: jobPost.maximumSalary,
          currency: jobPost.currency
        }
      : null,
    status: jobPost.status,
    keepOpen: jobPost.keepOpen,
    applicationDeadline: jobPost.applicationDeadline ? jobPost.applicationDeadline.toISOString().split("T")[0] : null,
    postedAt: jobPost.postedAt?.toISOString().split("T")[0],
    jobDescription: jobPost.jobDescription,
    requirements: jobPost.requirements,
    benefits: jobPost.benefits,
    responsibilities: jobPost.responsibilities,
    workingHours: jobPost.workingHours,
    startDate: jobPost.startDate,
    branches: jobPost.branchesInfo.map((b) => ({ id: b.branchId, name: b.branchName })),
    numberOfApplications: jobPost.applications.length
  };

  return SendResponse.success({
    res,
    message: "Job posting fetched successfully",
    data: {
      jobPost: formattedJobPost
    }
  });
}

export async function getAllPublicJobPostingsHandler(req: Request, res: Response) {
  const page = parseInt((req.query.page as string) || "1", 10);
  const limit = parseInt((req.query.limit as string) || "10", 10);

  const jobPosts = await findAllPublicCareerPostsPaginated(page, limit);
  const totalJobPosts = await countAllPublicCareerPosts();

  const hasNext = page * limit < totalJobPosts;

  const formattedJobPosts = jobPosts.map((post) => ({
    id: post._id.toString(),
    jobTitle: post.jobTitle,
    department: post.department,
    employmentType: post.employmentType,
    jobDescription: post.jobDescription,
    applicationDeadline: post.applicationDeadline ? post.applicationDeadline.toISOString().split("T")[0] : null,
    keepOpen: post.keepOpen,
    status: post.status,
    branches: post.branchesInfo.map((b) => ({ id: b.branchId, name: b.branchName })),
    salary: post.showSalary
      ? { minimum: post.minimumSalary, maximum: post.maximumSalary, currency: post.currency }
      : null,
    workingHours: post.workingHours,
    startDate: post.startDate,
    requirements: post.requirements,
    benefits: post.benefits,
    responsibilities: post.responsibilities,
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

export async function getSinglePublicJobPostingHandler(req: Request, res: Response) {
  const functionName = getSinglePublicJobPostingHandler.name;
  const { id } = req.params;

  const jobPost = await findPublicCareerPostById(id);
  if (!jobPost) {
    return SendErrorResponse.notFound({
      res,
      ...buildErrorPayload(
        req.originalUrl,
        functionName,
        req.method,
        "Job posting not found",
        DATA_NOT_FOUND,
        "Job posting not found"
      )
    });
  }

  const formattedJobPost = {
    id: jobPost._id.toString(),
    jobTitle: jobPost.jobTitle,
    department: jobPost.department,
    employmentType: jobPost.employmentType,
    showSalary: jobPost.showSalary,
    salary: jobPost.showSalary
      ? {
          minimum: jobPost.minimumSalary,
          maximum: jobPost.maximumSalary,
          currency: jobPost.currency
        }
      : null,
    status: jobPost.status,
    keepOpen: jobPost.keepOpen,
    applicationDeadline: jobPost.applicationDeadline ? jobPost.applicationDeadline.toISOString().split("T")[0] : null,
    postedAt: jobPost.postedAt?.toISOString().split("T")[0],
    jobDescription: jobPost.jobDescription,
    requirements: jobPost.requirements,
    benefits: jobPost.benefits,
    responsibilities: jobPost.responsibilities,
    workingHours: jobPost.workingHours,
    startDate: jobPost.startDate,
    branches: jobPost.branchesInfo.map((b) => ({ id: b.branchId, name: b.branchName }))
  };

  return SendResponse.success({
    res,
    message: "Job posting fetched successfully",
    data: {
      jobPost: formattedJobPost
    }
  });
}

export async function getJobPostApplicationsHandler(req: Request, res: Response) {
  const functionName = getJobPostApplicationsHandler.name;
  const { jobPostId } = req.params;
  const page = parseInt((req.query.page as string) || "1", 10);
  const limit = parseInt((req.query.limit as string) || "10", 10);

  const jobPost = await findCareerPostById(jobPostId);
  if (!jobPost) {
    return SendErrorResponse.notFound({
      res,
      ...buildErrorPayload(
        req.originalUrl,
        functionName,
        req.method,
        "Job posting not found",
        DATA_NOT_FOUND,
        "Job posting not found"
      )
    });
  }

  // apply pagination
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedApplications = jobPost.applications.slice(startIndex, endIndex);
  const totalItems = jobPost.applications.length;

  const hasNext = page * limit < jobPost.applications.length;

  const formattedApplications = paginatedApplications.map((app) => ({
    id: app.id,
    applicantName: app.applicantName,
    applicantEmail: app.applicantEmail,
    resumeUrl: app.resumeUrl,
    coverLetter: app.coverLetter || null,
    appliedAt: app.appliedAt.toISOString().split("T")[0]
  }));

  return SendResponse.success({
    res,
    message: "Job applications fetched successfully",
    data: {
      items: formattedApplications,
      currentPage: page,
      limit,
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
      hasNext
    }
  });
}

export async function updateJobPostingHandler(
  req: Request<{ id: string }, Record<string, never>, AddJobPostingType>,
  res: Response
) {
  const functionName = updateJobPostingHandler.name;
  const { id } = req.params;
  const data = req.body;

  const jobPost = await findCareerPostById(id);
  if (!jobPost) {
    return SendErrorResponse.notFound({
      res,
      ...buildErrorPayload(
        req.originalUrl,
        functionName,
        req.method,
        "Job posting not found",
        DATA_NOT_FOUND,
        "Job posting not found"
      )
    });
  }

  let applicationDeadline: Date | null = null;
  if (!data.keepOpen) {
    if (!data.applicationDeadline || !isValidDate(data.applicationDeadline)) {
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

    applicationDeadline = parseDateTimeFromDateAndTimeStr(data.applicationDeadline, "11:59 PM");
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

  jobPost.jobTitle = data.jobTitle.trim() || jobPost.jobTitle;
  jobPost.department = data.department.trim() || jobPost.department;
  jobPost.employmentType = data.employmentType || jobPost.employmentType;
  jobPost.showSalary = data.showSalary || jobPost.showSalary;
  jobPost.minimumSalary = data.minimumSalary ?? jobPost.minimumSalary;
  jobPost.maximumSalary = data.maximumSalary ?? jobPost.maximumSalary;
  jobPost.currency = data.currency?.trim() || jobPost.currency;
  jobPost.status = data.status || jobPost.status;
  jobPost.keepOpen = data.keepOpen ?? jobPost.keepOpen;
  jobPost.applicationDeadline = data.keepOpen ? null : applicationDeadline || jobPost.applicationDeadline;
  jobPost.jobDescription = data.jobDescription.trim() || jobPost.jobDescription;
  jobPost.requirements = data.requirements ? data.requirements.map((r) => r.trim()) : jobPost.requirements;
  jobPost.benefits = data.benefits ? data.benefits.map((b) => b.trim()) : jobPost.benefits;
  jobPost.responsibilities = data.responsibilities
    ? data.responsibilities.map((r) => r.trim())
    : jobPost.responsibilities;
  jobPost.workingHours = data.workingHours !== undefined ? data.workingHours?.trim() || null : jobPost.workingHours;
  jobPost.startDate = data.startDate !== undefined ? data.startDate?.trim() || null : jobPost.startDate;
  jobPost.branchesInfo = branches.map((b) => ({
    branchId: b._id.toString(),
    branchName: b.name
  }));
  if (jobPost.status === CareerPostStatus.ACTIVE && !jobPost.postedAt) {
    jobPost.postedAt = new Date();
  }

  await jobPost.save();

  return SendResponse.success({
    res,
    message: "Job posting updated successfully",
    data: {
      jobPost: {
        id: jobPost._id.toString()
      }
    }
  });
}

export async function deleteJobPostingHandler(req: Request<{ id: string }>, res: Response) {
  const functionName = deleteJobPostingHandler.name;
  const { id } = req.params;

  const jobPost = await findCareerPostById(id);
  if (!jobPost) {
    return SendErrorResponse.notFound({
      res,
      ...buildErrorPayload(
        req.originalUrl,
        functionName,
        req.method,
        "Job posting not found",
        DATA_NOT_FOUND,
        "Job posting not found"
      )
    });
  }

  await deleteCareerPostById(id);

  return SendResponse.success({
    res,
    message: "Job posting deleted successfully",
    data: null
  });
}

export async function closeJobPostingHandler(req: Request<{ id: string }>, res: Response) {
  const functionName = closeJobPostingHandler.name;
  const { id } = req.params;

  const jobPost = await findCareerPostById(id);
  if (!jobPost) {
    return SendErrorResponse.notFound({
      res,
      ...buildErrorPayload(
        req.originalUrl,
        functionName,
        req.method,
        "Job posting not found",
        DATA_NOT_FOUND,
        "Job posting not found"
      )
    });
  }

  if (jobPost.status === CareerPostStatus.CLOSED) {
    return SendErrorResponse.badRequest({
      res,
      ...buildErrorPayload(
        req.originalUrl,
        functionName,
        req.method,
        "Job posting is already closed",
        DATA_NOT_FOUND,
        "Job posting is already closed"
      )
    });
  }

  jobPost.status = CareerPostStatus.CLOSED;
  await jobPost.save();

  return SendResponse.success({
    res,
    message: "Job posting closed successfully",
    data: null
  });
}
