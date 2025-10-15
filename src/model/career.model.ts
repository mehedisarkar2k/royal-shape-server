import { DocumentType, getModelForClass, ModelOptions, Prop, Severity } from "@typegoose/typegoose";
import { v4 as uuid } from "uuid";
import { CareerPostStatus, EmploymentType } from "../constants";

class BranchInfo {
  @Prop({ required: true, type: String })
  branchId: string;

  @Prop({ required: true, type: String })
  branchName: string;
}

export class Application {
  @Prop({ required: true, type: String, default: () => uuid() })
  id: string;

  @Prop({ required: true, type: String })
  applicantName: string;

  @Prop({ required: true, type: String })
  applicantEmail: string;

  @Prop({ required: true, type: String })
  resumeUrl: string;

  @Prop({ required: false, type: String, default: null })
  coverLetter?: string | null;

  @Prop({ required: true, type: Date, default: Date.now })
  appliedAt: Date;
}

@ModelOptions({ schemaOptions: { collection: "careers", timestamps: true }, options: { allowMixed: Severity.ALLOW } })
export class Career {
  @Prop({ required: true, type: String })
  jobTitle: string;

  @Prop({ required: true, type: String })
  department: string;

  @Prop({ required: true, type: String, enum: EmploymentType })
  employmentType: string;

  @Prop({ required: true, type: Boolean })
  showSalary: boolean;

  @Prop({ required: false, type: Number, default: null })
  minimumSalary?: number | null;

  @Prop({ required: false, type: Number, default: null })
  maximumSalary?: number | null;

  @Prop({ required: false, type: String, default: null })
  currency: string | null;

  @Prop({ required: true, type: String, enum: CareerPostStatus })
  status: string;

  @Prop({ required: true, type: Date })
  applicationDeadline: Date;

  @Prop({ required: true, type: String })
  jobDescription: string;

  @Prop({ required: true, type: [String], default: [] })
  requirements: string[];

  @Prop({ required: false, type: [String], default: [] })
  benefits?: string[];

  @Prop({ required: true, type: Array<BranchInfo>, _id: false })
  branchesInfo: BranchInfo[];

  @Prop({ required: true, type: Array<Application>, default: [], _id: false })
  applications: Application[];

  @Prop({ type: Date, default: null })
  postedAt?: Date | null;
}

export const CareerModel = getModelForClass(Career);
export type CareerDocumentType = DocumentType<Career>;
