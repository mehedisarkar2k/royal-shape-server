import { Award, AwardModel } from "../model";

export function createAward(data: Award) {
  return AwardModel.create(data);
}

export function findAwardById(awardId: string) {
  return AwardModel.findById(awardId);
}

export function findAllAwardsPaginated(page: number, limit: number) {
  const skip = (page - 1) * limit;
  return AwardModel.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean();
}

export function countAllAwards() {
  return AwardModel.countDocuments({});
}
