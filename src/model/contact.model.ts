import { Prop, getModelForClass, ModelOptions } from "@typegoose/typegoose";
import { Phone } from "./common.model";

@ModelOptions({ schemaOptions: { collection: "contact_form_submissions", timestamps: true } })
export class ContactFormSubmission {
  @Prop({ required: true, type: String })
  name: string;

  @Prop({ required: true, type: String })
  email: string;

  @Prop({ required: true, type: Phone, _id: false })
  phone: Phone;

  @Prop({ required: true, type: String })
  meetingType: string;

  @Prop({ required: true, type: String })
  preferredDate: string;

  @Prop({ required: false, type: String, default: "" })
  message?: string;
}

export const ContactFormSubmissionModel = getModelForClass(ContactFormSubmission);
