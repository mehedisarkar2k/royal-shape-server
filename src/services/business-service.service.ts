import { Service, ServiceCategory, ServiceCategoryModel, ServiceModel } from "../model";

export async function createServiceCategory(data: ServiceCategory) {
  return ServiceCategoryModel.create(data);
}

export async function findAllServiceCategories() {
  return ServiceCategoryModel.find();
}

export async function createService(data: Service) {
  return ServiceModel.create(data);
}

export async function findServicesByCategoryId(categoryId: string) {
  return ServiceModel.find({ categoryId });
}

export async function findServicesByIds(serviceIds: string[]) {
  return ServiceModel.find({ _id: { $in: serviceIds } });
}

export async function findServiceCategoryById(categoryId: string) {
  return ServiceCategoryModel.findById(categoryId);
}
