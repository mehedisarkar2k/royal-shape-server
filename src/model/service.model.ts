import { DocumentType, getModelForClass, ModelOptions, Prop, Severity } from "@typegoose/typegoose";
import { ServiceStatus } from "../constants";

class BranchRef {
  @Prop({ required: true, type: String })
  branchId: string;

  @Prop({ required: true, type: String })
  branchName: string;
}

@ModelOptions({ schemaOptions: { collection: "services", timestamps: true }, options: { allowMixed: Severity.ALLOW } })
export class Service {
  @Prop({ required: true, type: String })
  name: string;

  @Prop({ required: false, type: String, default: null })
  description?: string | null;

  @Prop({ required: true, type: String })
  categoryId: string;

  @Prop({ required: true, type: String })
  duration: string;

  @Prop({ required: true, type: Number })
  price: number;

  @Prop({ required: false, type: String, default: "AUD" })
  currency?: string | "AUD";

  @Prop({ required: false, type: String, default: null })
  thumbnail?: string | null;

  @Prop({ required: true, type: Array<BranchRef>, default: [], _id: false })
  branches: BranchRef[];

  @Prop({ required: true, type: String, enum: ServiceStatus })
  status: ServiceStatus;

  // Ascending sort position within its category (lower shows first).
  // Unset/new services default to the end.
  @Prop({ required: false, type: Number, default: 9999 })
  displayOrder?: number;
}

export const ServiceModel = getModelForClass(Service);
export type ServiceDocumentType = DocumentType<Service>;
