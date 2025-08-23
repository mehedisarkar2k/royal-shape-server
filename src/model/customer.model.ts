import { DocumentType, getModelForClass, ModelOptions, Prop } from "@typegoose/typegoose";
import { Phone } from "./common.model";

@ModelOptions({ schemaOptions: { collection: "customers", timestamps: true } })
export class Customer {
  @Prop({ required: true, type: String })
  firstName: string;

  @Prop({ required: false, type: String, default: null })
  lastName?: string | null;

  @Prop({ required: false, type: Phone, default: null, _id: false })
  phone?: Phone | null;

  @Prop({ required: false, type: String, default: null })
  email?: string | null;

  @Prop({ required: false, type: String, default: null })
  description?: string | null;
}

export const CustomerModel = getModelForClass(Customer);
export type CustomerDocumentType = DocumentType<Customer>;
