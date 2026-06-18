import { DocumentType, getModelForClass, ModelOptions, Prop, Severity } from "@typegoose/typegoose";
import { EmploymentType, JobAdStatus } from "../constants";

class BranchRef {
  @Prop({ required: true, type: String })
  branchId: string;

  @Prop({ required: true, type: String })
  branchName: string;
}

class JobApplication {
  @Prop({ required: true, type: String })
  applicantName: string;

  @Prop({ required: true, type: String })
  applicantEmail: string;

  @Prop({ required: true, type: String })
  resumeLink: string;

  @Prop({ required: false, type: String, default: null })
  coverLetterLink?: string | null;
}

@ModelOptions({ schemaOptions: { collection: "job_ads", timestamps: true }, options: { allowMixed: Severity.ALLOW } })
export class JobAd {
  @Prop({ required: true, type: String })
  title: string;

  @Prop({ required: true, type: String })
  department: string;

  @Prop({ required: true, type: String, enum: EmploymentType })
  employmentType: EmploymentType;

  @Prop({ required: true, type: Number })
  minimumSalary: number;

  @Prop({ required: true, type: Number })
  maximumSalary: number;

  @Prop({ required: true, type: String })
  currency: string;

  @Prop({ required: true, type: String, enum: JobAdStatus })
  status: JobAdStatus;

  @Prop({ required: true, type: Date })
  applicationDeadline: Date;

  @Prop({ required: true, type: String })
  jobDescription: string;

  @Prop({ required: true, type: Array<string> })
  requirements: string[];

  @Prop({ required: true, type: Array<string> })
  benefits: string[];

  @Prop({ required: false, type: Array<string>, default: [] })
  responsibilities: string[];

  @Prop({ required: false, type: String, default: null })
  workingHours: string | null;

  @Prop({ required: false, type: String, default: null })
  startDate: string | null;

  @Prop({ required: true, type: Array<BranchRef>, default: [], _id: false })
  branches: BranchRef[];

  @Prop({ required: true, type: Array<JobApplication>, default: [], _id: false })
  applications: JobApplication[];
}

export const JobAdModel = getModelForClass(JobAd);
export type JobAdDocumentType = DocumentType<JobAd>;
