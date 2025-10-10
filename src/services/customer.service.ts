import { Customer, CustomerModel } from "../model";

export function createCustomer(data: Customer) {
  return CustomerModel.create(data);
}

export function findCustomerByEmail(email: string) {
  return CustomerModel.findOne({ email });
}
