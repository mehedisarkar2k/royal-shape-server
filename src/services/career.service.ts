import { Career, CareerModel } from "../model";

export async function createCareerPost(data: Career) {
  return CareerModel.create(data);
}

export async function findAllCareerPostsPaginated(page: number, limit: number) {
  return CareerModel.find({})
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();
}

export async function findAllCareerPosts() {
  return CareerModel.find({}).sort({ createdAt: -1 }).lean();
}

export async function countAllCareerPosts() {
  return CareerModel.countDocuments({});
}

export async function findCareerPostById(careerId: string) {
  return CareerModel.findById(careerId);
}

export async function deleteCareerPostById(careerId: string) {
  return CareerModel.findByIdAndDelete(careerId);
}
