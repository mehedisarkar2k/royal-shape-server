import { DocumentType, getModelForClass, ModelOptions, Prop } from "@typegoose/typegoose";
import { ServiceStatus } from "../constants";

class BranchRef {
  @Prop({ required: true, type: String })
  branchId: string;

  @Prop({ required: true, type: String })
  branchName: string;
}

@ModelOptions({ schemaOptions: { collection: "services", timestamps: true } })
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
}

export const ServiceModel = getModelForClass(Service);
export type ServiceDocumentType = DocumentType<Service>;
