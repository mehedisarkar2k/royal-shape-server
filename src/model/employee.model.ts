import { DocumentType, getModelForClass, ModelOptions, Prop } from "@typegoose/typegoose";
import { Phone } from "./common.model";
import { EmploymentStatus } from "../constants";

class BranchRef {
  @Prop({ required: true, type: String })
  branchId: string;

  @Prop({ required: true, type: String })
  branchName: string;
}

@ModelOptions({ schemaOptions: { collection: "employees", timestamps: true } })
export class Employee {
  @Prop({ required: true, type: String })
  name: string;

  @Prop({ required: true, type: Phone, _id: false })
  phone: Phone;

  @Prop({ required: true, type: String, unique: true })
  email: string;

  @Prop({ required: true, type: String })
  address: string;

  @Prop({ required: true, type: String })
  jobRole: string;

  @Prop({ required: true, type: String })
  department: string;

  @Prop({ required: true, type: BranchRef, _id: false })
  branchInfo: BranchRef;

  @Prop({ required: true, type: String, enum: EmploymentStatus })
  status: EmploymentStatus;

  @Prop({ required: true, type: Number, default: 5.0 })
  rating: number;

  @Prop({ required: true, type: Number, default: 0 })
  serviceCompleted: number;
}

export const EmployeeModel = getModelForClass(Employee);
export type EmployeeDocumentType = DocumentType<Employee>;
