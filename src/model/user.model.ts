import { ModelOptions, Prop, Severity, getModelForClass } from "@typegoose/typegoose";
import { Document } from "mongoose";
import { UserType } from "../constants";
import { Phone } from "./common.model";

@ModelOptions({ schemaOptions: { collection: "users", timestamps: true }, options: { allowMixed: Severity.ALLOW } })
export class User {
  @Prop({ required: true, type: String })
  firstName: string;

  @Prop({ required: false, type: String, default: null })
  lastName?: string | null;

  @Prop({ required: false, type: String, default: null })
  email?: string | null;

  @Prop({ required: false, type: Phone, default: null })
  phone?: Phone | null;

  @Prop({ required: true, type: String, enum: UserType })
  userType: string;

  @Prop({ required: true, type: String, enum: UserType })
  role: string;

  @Prop({ required: false, type: String, default: null })
  profilePicture?: string | null;

  @Prop({ required: false, type: Date, default: null })
  lastLogin?: Date | null;

  @Prop({ required: false, type: String, default: null })
  address?: string | null;
}

export const UserModel = getModelForClass(User);
export type UserDocumentType = User & Document;
