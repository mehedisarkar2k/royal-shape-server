import { DocumentType, getModelForClass, ModelOptions, Prop, Severity } from "@typegoose/typegoose";
import { ServiceStatus } from "../constants";

class BranchRef {
  @Prop({ required: true, type: String })
  branchId: string;

  @Prop({ required: true, type: String })
  branchName: string;
}

@ModelOptions({
  schemaOptions: { collection: "service_categories", timestamps: true },
  options: { allowMixed: Severity.ALLOW }
})
export class ServiceCategory {
  @Prop({ required: true, type: String })
  name: string;

  @Prop({ required: false, type: String, default: null })
  description?: string | null;

  @Prop({ required: true, type: Array<BranchRef>, default: [], _id: false })
  branches: BranchRef[];

  @Prop({ required: true, type: String, enum: ServiceStatus })
  status: ServiceStatus;

  @Prop({ required: true, type: String })
  thumbnail: string;
}

export const ServiceCategoryModel = getModelForClass(ServiceCategory);
export type ServiceCategoryDocumentType = DocumentType<ServiceCategory>;
