import { Service, ServiceCategory, ServiceCategoryModel, ServiceModel } from "../model";

export async function createServiceCategory(data: ServiceCategory) {
  return ServiceCategoryModel.create(data);
}

export async function findAllServiceCategories() {
  return ServiceCategoryModel.find().sort({ displayOrder: 1 });
}

export async function findAllServiceCategoriesOfBranch(branchId: string) {
  return ServiceCategoryModel.find({ "branches.branchId": branchId, status: "active" }).sort({ displayOrder: 1 });
}

export async function findAllServiceCategoriesPaginated(page: number, limit: number) {
  return ServiceCategoryModel.find()
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);
}

export async function countServiceCategories() {
  return ServiceCategoryModel.countDocuments({});
}

export async function createService(data: Service) {
  return ServiceModel.create(data);
}

export async function findServicesByCategoryId(categoryId: string) {
  return ServiceModel.find({ categoryId });
}

export async function findActiveServicesByCategoryIdAndBranch(categoryId: string, branchId: string) {
  return ServiceModel.find({
    categoryId,
    status: "active",
    "branches.branchId": branchId
  });
}

export async function findServicesByIds(serviceIds: string[]) {
  return ServiceModel.find({ _id: { $in: serviceIds } });
}

export async function findServiceCategoryById(categoryId: string) {
  return ServiceCategoryModel.findById(categoryId);
}

export async function countServicesOfCategory(categoryId: string) {
  return ServiceModel.countDocuments({ categoryId });
}

export async function findServiceById(serviceId: string) {
  return ServiceModel.findById(serviceId);
}

export async function deleteServiceCategoryById(categoryId: string) {
  return ServiceCategoryModel.findByIdAndDelete(categoryId);
}

export async function deleteServicesByCategoryId(categoryId: string) {
  return ServiceModel.deleteMany({ categoryId });
}

export async function deleteServiceById(serviceId: string) {
  return ServiceModel.findByIdAndDelete(serviceId);
}
