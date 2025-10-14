import { Request, Response } from "express";
import { v4 as uuid } from "uuid";
import { AddEmployeeInput } from "../schemas";
import { SendErrorResponse, SendResponse } from "../utils";
import { countAllEmployees, createEmployee, findAllEmployeesPaginated, findBranchById } from "../services";
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
      branchId: data.branchId,
      branchName: data.name
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
    phone: emp.phone.e164,
    branch: emp.branchInfo.branchName,
    rating: emp.rating,
    serviceCompleted: emp.serviceCompleted,
    status: emp.status,
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
