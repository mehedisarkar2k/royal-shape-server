import { DocumentType, getModelForClass, ModelOptions, Prop, Severity } from "@typegoose/typegoose";

class BranchRef {
  @Prop({ required: true, type: String })
  branchId: string;

  @Prop({ required: true, type: String })
  branchName: string;
}

@ModelOptions({ schemaOptions: { collection: "combos", timestamps: true }, options: { allowMixed: Severity.ALLOW } })
export class Combo {
  @Prop({ required: true, type: String })
  name: string;

  @Prop({ required: false, type: String, default: null })
  description?: string | null;

  @Prop({ required: true, type: String })
  duration: string;

  @Prop({ required: true, type: Number })
  price: number;

  @Prop({ required: false, type: String, default: "AUD" })
  currency?: string | "AUD";

  @Prop({ required: true, type: Array<BranchRef>, default: [], _id: false })
  branches: BranchRef[];

  @Prop({ required: true, type: [String] })
  comboItems: string[];
}

export const ComboModel = getModelForClass(Combo);
export type ComboDocumentType = DocumentType<Combo>;
