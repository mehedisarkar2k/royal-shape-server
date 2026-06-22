import { PipelineStage, Types } from "mongoose";
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

export async function findCustomerById(customerId: string) {
  return CustomerModel.findById(customerId);
}

// Returns the _ids (as strings) of customers matching a free-text term
// across first/last name, email, and phone number.
export async function findCustomerIdsBySearch(term: string): Promise<string[]> {
  const regex = new RegExp(term.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
  const customers = await CustomerModel.find({
    $or: [
      { firstName: regex },
      { lastName: regex },
      { email: regex },
      { "phone.number": regex },
      { "phone.e164": regex }
    ]
  })
    .select("_id")
    .lean();
  return customers.map((c) => c._id.toString());
}

export async function findCustomersWithBookingDetails(customerIds: string[]) {
  const pipeline: PipelineStage[] = [
    {
      $match: {
        _id: {
          $in: customerIds.map((id) => new Types.ObjectId(id))
        }
      }
    },
    {
      $addFields: {
        customerIdStr: {
          $toString: "$_id"
        }
      }
    },
    {
      $lookup: {
        from: "bookings",
        localField: "customerIdStr",
        foreignField: "customerId",
        as: "bookings"
      }
    }
  ];

  const results = await CustomerModel.aggregate(pipeline);
  return results;
}

export async function findAllCustomersWithBookingDetailsPaginated(page: number, limit: number) {
  const pipeline: PipelineStage[] = [
    {
      $addFields: {
        customerIdStr: {
          $toString: "$_id"
        }
      }
    },
    {
      $lookup: {
        from: "bookings",
        localField: "customerIdStr",
        foreignField: "customerId",
        as: "bookings"
      }
    },
    {
      $sort: {
        createdAt: -1
      }
    },
    {
      $skip: (page - 1) * limit
    },
    {
      $limit: limit
    }
  ];
  const results = await CustomerModel.aggregate(pipeline);
  return results;
}

export async function deleteCustomerById(customerId: string) {
  return CustomerModel.findByIdAndDelete(customerId);
}
