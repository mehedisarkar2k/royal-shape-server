import { Branch, BranchModel } from "../model";

export function createBranch(data: Branch) {
  return BranchModel.create(data);
}

export function findAllBranches() {
  return BranchModel.find().sort({ displayOrder: 1, createdAt: 1 });
}

export function findBranchById(id: string) {
  return BranchModel.findById(id);
}

export function findBranchesByIds(ids: string[]) {
  return BranchModel.find({ _id: { $in: ids } });
}
