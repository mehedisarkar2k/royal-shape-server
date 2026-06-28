import { Request, Response } from "express";
import { v4 as uuid } from "uuid";
import { CreateBranchType } from "../schemas";
import {
  createBranch,
  findAllBranches,
  findBranchById,
  countEmployeesByBranch,
  countDistinctCustomersByBranch
} from "../services";
import { SendErrorResponse, SendResponse, appCache } from "../utils";
import { uploadFileR2WithAutoKey } from "../services/r2-storage.service";
import { ApplicationServices, DATA_NOT_FOUND, FORBIDDEN_ERROR, INPUT_MISSING, UNEXPECTED_ERROR } from "../constants";

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
    service: ApplicationServices.BRANCH,
    id: uuid()
  }
});

export async function createBranchHandler(
  req: Request<Record<string, never>, Record<string, never>, CreateBranchType>,
  res: Response
) {
  const functionName = createBranchHandler.name;

  const { user } = res.locals;
  const data = req.body;

  if (user.userType !== "admin") {
    return SendErrorResponse.forbidden({
      res,
      ...buildErrorPayload(
        req.originalUrl,
        functionName,
        req.method,
        "Unauthorized access! The user is not an admin trying to create a branch.",
        FORBIDDEN_ERROR,
        "Only admins can create branches. If you think this is an error, please contact support."
      )
    });
  }

  const newBranch = await createBranch({
    ...data,
    phone: { ...data.phone, e164: `${data.phone.countryCode}${data.phone.number}` },
    image: data.image || null,
    latitude: data.latitude,
    longitude: data.longitude
  });

  appCache.del("website_branches_data");
  appCache.del("website_home_data");

  return SendResponse.created({
    res,
    message: "Branch created successfully!",
    data: {
      id: newBranch._id.toString()
    }
  });
}

export async function getAllBranchesHandler(req: Request, res: Response) {
  const branches = await findAllBranches();

  const branchesWithStats = await Promise.all(
    branches.map(async (branch) => {
      const branchId = branch._id.toString();
      const [numberOfEmployees, numberOfCustomers] = await Promise.all([
        countEmployeesByBranch(branchId),
        countDistinctCustomersByBranch(branchId)
      ]);
      return {
        id: branchId,
        name: branch.name,
        phone: branch.phone,
        email: branch.email,
        address: branch.address,
        managerName: branch.managerName,
        status: branch.status,
        weeklySchedule: branch.weeklySchedule,
        establishedYear: branch.establishedYear,
        description: branch.description,
        image: branch.image,
        googleReviewLink: branch.googleReviewLink,
        googleLocationId: branch.googleLocationId,
        rating: branch.rating,
        numberOfEmployees,
        numberOfCustomers
      };
    })
  );

  return SendResponse.success({
    res,
    message: "Branches fetched successfully!",
    data: {
      branches: branchesWithStats
    }
  });
}

export async function updateBranchHandler(
  req: Request<{ id: string }, Record<string, never>, CreateBranchType>,
  res: Response
) {
  const functionName = updateBranchHandler.name;

  const { user } = res.locals;
  const { id } = req.params;
  const data = req.body;

  if (user.userType !== "admin") {
    return SendErrorResponse.forbidden({
      res,
      ...buildErrorPayload(
        req.originalUrl,
        functionName,
        req.method,
        "Unauthorized access! The user is not an admin trying to update a branch.",
        FORBIDDEN_ERROR,
        "Only admins can update branches. If you think this is an error, please contact support."
      )
    });
  }
  const branch = await findBranchById(id);

  if (!branch) {
    return SendErrorResponse.notFound({
      res,
      ...buildErrorPayload(
        req.originalUrl,
        functionName,
        req.method,
        "Branch not found.",
        DATA_NOT_FOUND,
        "Please check the branch ID and try again."
      )
    });
  }

  branch.name = data.name;
  branch.phone = { ...data.phone, e164: `${data.phone.countryCode}${data.phone.number}` };
  branch.email = data.email;
  branch.address = data.address;
  branch.managerName = data.managerName;
  branch.status = data.status;
  branch.weeklySchedule = data.weeklySchedule;
  branch.establishedYear = data.establishedYear || null;
  branch.description = data.description || null;
  branch.image = data.image || null;
  branch.googleReviewLink = data.googleReviewLink || null;
  branch.googleLocationId = data.googleLocationId || null;
  branch.latitude = data.latitude;
  branch.longitude = data.longitude;

  branch.markModified("weeklySchedule");
  await branch.save();

  appCache.del("website_branches_data");
  appCache.del("website_home_data");
  appCache.del(`website_branch_services_data_${id}`);

  return SendResponse.success({
    res,
    message: "Branch updated successfully!",
    data: {
      id: branch._id.toString()
    }
  });
}

export async function getBranchByIdHandler(req: Request<{ id: string }>, res: Response) {
  const functionName = getBranchByIdHandler.name;

  const { user } = res.locals;
  const { id } = req.params;

  if (user.userType !== "admin") {
    return SendErrorResponse.forbidden({
      res,
      ...buildErrorPayload(
        req.originalUrl,
        functionName,
        req.method,
        "Unauthorized access! The user is not an admin trying to get a branch by ID.",
        FORBIDDEN_ERROR,
        "Only admins can access branch details. If you think this is an error, please contact support."
      )
    });
  }

  const branch = await findBranchById(id);

  if (!branch) {
    return SendErrorResponse.notFound({
      res,
      ...buildErrorPayload(
        req.originalUrl,
        functionName,
        req.method,
        "Branch not found.",
        DATA_NOT_FOUND,
        "Please check the branch ID and try again."
      )
    });
  }

  return SendResponse.success({
    res,
    message: "Branch fetched successfully!",
    data: {
      branch: {
        id: branch._id.toString(),
        name: branch.name,
        phone: branch.phone,
        email: branch.email,
        address: branch.address,
        managerName: branch.managerName,
        status: branch.status,
        weeklySchedule: branch.weeklySchedule,
        establishedYear: branch.establishedYear,
        description: branch.description,
        image: branch.image,
        googleReviewLink: branch.googleReviewLink,
        googleLocationId: branch.googleLocationId,
        rating: branch.rating,
        latitude: branch.latitude,
        longitude: branch.longitude
      }
    }
  });
}

export async function deleteBranchHandler(req: Request<{ id: string }>, res: Response) {
  const functionName = deleteBranchHandler.name;

  const { user } = res.locals;
  const { id } = req.params;

  if (user.userType !== "admin") {
    return SendErrorResponse.forbidden({
      res,
      ...buildErrorPayload(
        req.originalUrl,
        functionName,
        req.method,
        "Unauthorized access! The user is not an admin trying to delete a branch.",
        FORBIDDEN_ERROR,
        "Only admins can delete branches. If you think this is an error, please contact support."
      )
    });
  }

  const branch = await findBranchById(id);

  if (!branch) {
    return SendErrorResponse.notFound({
      res,
      ...buildErrorPayload(
        req.originalUrl,
        functionName,
        req.method,
        "Branch not found.",
        DATA_NOT_FOUND,
        "Please check the branch ID and try again."
      )
    });
  }

  await branch.deleteOne();

  appCache.del("website_branches_data");
  appCache.del("website_home_data");
  appCache.del(`website_branch_services_data_${id}`);

  return SendResponse.success({
    res,
    message: "Branch deleted successfully!",
    data: {
      id: branch._id.toString()
    }
  });
}

export async function uploadBranchImageHandler(req: Request, res: Response) {
  const functionName = uploadBranchImageHandler.name;
  const { file } = req;
  if (!file) {
    return SendErrorResponse.badRequest({
      res,
      ...buildErrorPayload(
        req.originalUrl,
        functionName,
        req.method,
        "No image file uploaded",
        INPUT_MISSING,
        "No image file uploaded"
      )
    });
  }

  const filepath = file.path;

  const fileUploadRes = await uploadFileR2WithAutoKey(filepath, "branch-images", false);

  if (!fileUploadRes.success) {
    if (fileUploadRes.code === 404) {
      return SendErrorResponse.notFound({
        res,
        ...buildErrorPayload(
          req.originalUrl,
          functionName,
          req.method,
          fileUploadRes.message || "Image not found",
          DATA_NOT_FOUND,
          "Image not found"
        )
      });
    }

    return SendErrorResponse.internalServer({
      res,
      ...buildErrorPayload(
        req.originalUrl,
        functionName,
        req.method,
        fileUploadRes.message || "Image upload failed",
        UNEXPECTED_ERROR,
        "Image upload failed"
      )
    });
  }

  return SendResponse.success({
    res,
    message: "Image uploaded successfully",
    data: {
      url: fileUploadRes.publicUrl
    }
  });
}
