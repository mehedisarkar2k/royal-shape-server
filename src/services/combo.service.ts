import { Combo, ComboModel } from "../model";

export async function createCombo(data: Combo) {
  return ComboModel.create(data);
}

export async function findAllCombos() {
  return ComboModel.find({});
}

export async function findComboById(comboId: string) {
  return ComboModel.findById(comboId);
}

export async function findAllCombosPaginated(page: number, limit: number) {
  const skip = (page - 1) * limit;
  const combos = await ComboModel.find({}).sort({ createdAt: -1 }).skip(skip).limit(limit);
  return combos;
}

export async function countCombos() {
  return ComboModel.countDocuments({});
}
