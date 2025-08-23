import { DocumentType, getModelForClass, ModelOptions, Prop } from "@typegoose/typegoose";
import { ServiceStatus } from "../constants";

class BranchRef {
  @Prop({ required: true, type: String })
  branchId: string;

  @Prop({ required: true, type: String })
  branchName: string;
}

@ModelOptions({ schemaOptions: { collection: "service_categories", timestamps: true } })
export class ServiceCategory {
  @Prop({ required: true, type: String })
  name: string;

  @Prop({ required: false, type: String, default: null })
  description?: string | null;

  @Prop({ required: true, type: Array<BranchRef>, default: [], _id: false })
  branches: BranchRef[];

  @Prop({ required: true, type: String, enum: ServiceStatus })
  status: ServiceStatus;
}

export const ServiceCategoryModel = getModelForClass(ServiceCategory);
export type ServiceCategoryDocumentType = DocumentType<ServiceCategory>;
