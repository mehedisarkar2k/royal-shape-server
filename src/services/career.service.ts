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

export async function findAllPublicCareerPostsPaginated(page: number, limit: number) {
  return CareerModel.find({ status: "Active", applicationDeadline: { $gte: new Date() } })
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

export async function countAllPublicCareerPosts() {
  return CareerModel.countDocuments({ status: "Active", applicationDeadline: { $gte: new Date() } });
}

export async function findCareerPostById(careerId: string) {
  return CareerModel.findById(careerId);
}

export async function findPublicCareerPostById(careerId: string) {
  return CareerModel.findOne({ _id: careerId, status: "Active", applicationDeadline: { $gte: new Date() } });
}

export async function deleteCareerPostById(careerId: string) {
  return CareerModel.findByIdAndDelete(careerId);
}
