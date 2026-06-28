import { Employee, EmployeeModel } from "../model";

export async function createEmployee(data: Employee) {
  return EmployeeModel.create(data);
}

export async function findEmployeeByEmail(email: string) {
  return EmployeeModel.findOne({ email });
}

export async function findEmployeeById(employeeId: string) {
  return EmployeeModel.findById(employeeId);
}

export async function findAllEmployeesPaginated(page: number, limit: number) {
  return EmployeeModel.find({})
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();
}

export async function countAllEmployees() {
  return EmployeeModel.countDocuments({});
}

export async function countEmployeesByBranch(branchId: string) {
  return EmployeeModel.countDocuments({ "branchInfo.branchId": branchId });
}

export async function deleteEmployeeById(employeeId: string) {
  return EmployeeModel.findByIdAndDelete(employeeId);
}
