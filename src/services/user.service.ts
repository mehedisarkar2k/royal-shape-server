import { User, UserModel } from "../model";

export const findUserByEmail = async (email: string) => {
  return UserModel.findOne({ email });
};

export const findUserByEmailLeanFormat = async (email: string) => {
  return UserModel.findOne({ email }).lean();
};

export const findUserById = async (id: string) => {
  return UserModel.findById(id);
};

export const findUserByPhone = async (phone: string) => {
  return UserModel.findOne({ "phone.e164": phone });
};

export const findUserByPhoneLeanFormat = async (phone: string) => {
  return UserModel.findOne({ "phone.e164": phone }).lean();
};

export const createUser = async (userData: User) => {
  return UserModel.create(userData);
};
