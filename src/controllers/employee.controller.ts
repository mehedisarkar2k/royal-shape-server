import { Request, Response } from "express";
import { v4 as uuid } from "uuid";
import { AddEmployeeInput } from "../schemas";
import { SendErrorResponse, SendResponse, appCache } from "../utils";
import {
  countAllEmployees,
  createEmployee,
  deleteEmployeeById,
  findAllEmployeesPaginated,
  findBranchById,
  findEmployeeById
} from "../services";
import { ApplicationServices, DATA_NOT_FOUND, EmploymentStatus } from "../constants";

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
    service: ApplicationServices.EMPLOYEE,
    id: uuid()
  }
});

export async function addEmployeeHandler(
  req: Request<Record<string, never>, Record<string, never>, AddEmployeeInput>,
  res: Response
) {
  const functionName = addEmployeeHandler.name;
  const data = req.body;

  const branch = await findBranchById(data.branchId);
  if (!branch) {
    return SendErrorResponse.notFound({
      res,
      ...buildErrorPayload(
        req.originalUrl,
        functionName,
        req.method,
        "Branch not found",
        DATA_NOT_FOUND,
        "Branch not found"
      )
    });
  }

  const employee = await createEmployee({
    branchInfo: {
      branchId: branch._id.toString(),
      branchName: branch.name
    },
    name: data.name.trim(),
    email: data.email.toLowerCase().trim(),
    jobRole: data.jobRole.trim(),
    phone: {
      countryCode: data.phoneNumber.countryCode.trim(),
      number: data.phoneNumber.number.trim(),
      e164: `${data.phoneNumber.countryCode.trim()}${data.phoneNumber.number.trim()}`
    },
    department: data.department?.trim() || null,
    address: data.address?.trim() || "",
    profileImage: data.profileImage?.trim() || null,
    rating: 5.0,
    serviceCompleted: 0,
    status: EmploymentStatus.ACTIVE
  });
  if (!employee) {
    return SendErrorResponse.internalServer({
      res,
      ...buildErrorPayload(
        req.originalUrl,
        functionName,
        req.method,
        "Failed to add employee",
        DATA_NOT_FOUND,
        "Failed to add employee"
      )
    });
  }

  appCache.del("website_home_data");

  return SendResponse.success({
    res,
    message: "Employee added successfully",
    data: {
      employeeId: employee._id.toString()
    }
  });
}

export async function getAllEmployeesHandler(req: Request, res: Response) {
  const page = parseInt((req.query.page as string) || "1", 10);
  const limit = parseInt((req.query.limit as string) || "10", 10);

  const employees = await findAllEmployeesPaginated(page, limit);
  const totalEmployees = await countAllEmployees();

  const hasNext = page * limit < totalEmployees;

  const employeesFormatted = employees.map((emp) => ({
    id: emp._id.toString(),
    name: emp.name,
    email: emp.email,
    jobRole: emp.jobRole,
    phone: emp.phone,
    branch: { id: emp.branchInfo.branchId, name: emp.branchInfo.branchName },
    rating: emp.rating,
    department: emp.department || null,
    // serviceCompleted: emp.serviceCompleted,
    // status: emp.status,
    profileImage: emp.profileImage
  }));

  return SendResponse.success({
    res,
    message: "Employees fetched successfully",
    data: {
      items: employeesFormatted,
      currentPage: page,
      limit,
      totalItems: totalEmployees,
      totalPages: Math.ceil(totalEmployees / limit),
      hasNext
    }
  });
}

export async function getSingleEmployeeHandler(req: Request, res: Response) {
  const functionName = getSingleEmployeeHandler.name;
  const { employeeId } = req.params;

  const employee = await findEmployeeById(employeeId);
  if (!employee) {
    return SendErrorResponse.notFound({
      res,
      ...buildErrorPayload(
        req.originalUrl,
        functionName,
        req.method,
        "Employee not found",
        DATA_NOT_FOUND,
        "Employee not found"
      )
    });
  }

  const branch = await findBranchById(employee.branchInfo.branchId);
  if (!branch) {
    return SendErrorResponse.notFound({
      res,
      ...buildErrorPayload(
        req.originalUrl,
        functionName,
        req.method,
        "Branch not found",
        DATA_NOT_FOUND,
        "Branch not found"
      )
    });
  }

  return SendResponse.success({
    res,
    message: "Fetched employee successfully",
    data: {
      employee: {
        id: employee._id.toString(),
        name: employee.name,
        email: employee.email,
        jobRole: employee.jobRole,
        phone: employee.phone,
        department: employee.department,
        address: employee.address,
        profileImage: employee.profileImage,
        branch: {
          id: branch._id.toString(),
          name: branch.name
        }
      }
    }
  });
}

export async function deleteEmployeeHandler(req: Request, res: Response) {
  const functionName = deleteEmployeeHandler.name;
  const { employeeId } = req.params;

  const employee = await findEmployeeById(employeeId);
  if (!employee) {
    return SendErrorResponse.notFound({
      res,
      ...buildErrorPayload(
        req.originalUrl,
        functionName,
        req.method,
        "Employee not found",
        DATA_NOT_FOUND,
        "Employee not found"
      )
    });
  }

  await deleteEmployeeById(employeeId);

  appCache.del("website_home_data");

  return SendResponse.success({
    res,
    message: "Employee deleted successfully",
    data: null
  });
}

export async function updateEmployeeHandler(
  req: Request<{ employeeId: string }, Record<string, never>, AddEmployeeInput>,
  res: Response
) {
  const functionName = updateEmployeeHandler.name;
  const { employeeId } = req.params;
  const data = req.body;

  const employee = await findEmployeeById(employeeId);
  if (!employee) {
    return SendErrorResponse.notFound({
      res,
      ...buildErrorPayload(
        req.originalUrl,
        functionName,
        req.method,
        "Employee not found",
        DATA_NOT_FOUND,
        "Employee not found"
      )
    });
  }

  if (employee.branchInfo.branchId !== data.branchId) {
    const branch = await findBranchById(data.branchId);
    if (!branch) {
      return SendErrorResponse.notFound({
        res,
        ...buildErrorPayload(
          req.originalUrl,
          functionName,
          req.method,
          "Branch not found",
          DATA_NOT_FOUND,
          "Branch not found"
        )
      });
    }
    employee.branchInfo = {
      branchId: data.branchId,
      branchName: branch.name
    };
  }

  employee.name = data.name.trim();
  employee.jobRole = data.jobRole.trim();
  employee.phone = {
    countryCode: data.phoneNumber.countryCode.trim(),
    number: data.phoneNumber.number.trim(),
    e164: `${data.phoneNumber.countryCode.trim()}${data.phoneNumber.number.trim()}`
  };
  employee.department = data.department?.trim() || null;
  employee.address = data.address?.trim() || "";
  employee.profileImage = data.profileImage?.trim() || null;

  await employee.save();

  appCache.del("website_home_data");

  return SendResponse.success({
    res,
    message: "Employee updated successfully",
    data: {
      employee: {
        id: employee._id.toString()
      }
    }
  });
}
