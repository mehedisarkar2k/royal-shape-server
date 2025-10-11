import { Customer, CustomerModel } from "../model";

export async function createCustomer(data: Customer) {
  return CustomerModel.create(data);
}

export async function findCustomerByEmail(email: string) {
  return CustomerModel.findOne({ email });
}

export async function findAllCustomersPaginated(page: number, limit: number) {
  return CustomerModel.find({})
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();
}

export async function countAllCustomers() {
  return CustomerModel.countDocuments({});
}
