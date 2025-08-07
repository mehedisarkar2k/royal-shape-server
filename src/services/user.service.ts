import { User, UserModel } from "../model";

export const findUserByEmail = async (email: string) => {
  return UserModel.findOne({ email });
};

export const findUserById = async (id: string) => {
  return UserModel.findById(id);
};

export const findUserByPhone = async (phone: string) => {
  return UserModel.findOne({ "phone.e164": phone });
};

export const createUser = async (userData: User) => {
  return UserModel.create(userData);
};
