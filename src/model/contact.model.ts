import { Prop, getModelForClass, ModelOptions } from "@typegoose/typegoose";

@ModelOptions({ schemaOptions: { collection: "contact_form_submissions", timestamps: true } })
export class ContactFormSubmission {
  @Prop({ required: true, type: String })
  name: string;

  @Prop({ required: true, type: String })
  email: string;

  @Prop({ required: true, type: String })
  topic: string;

  @Prop({ required: true, type: String })
  message: string;

  @Prop({ required: true, type: Boolean, default: false })
  isRead: boolean;

  @Prop({ required: false, default: Date.now })
  createdAt?: Date;
}

export const ContactFormSubmissionModel = getModelForClass(ContactFormSubmission);
