import { getModelForClass, ModelOptions, Prop, Severity } from "@typegoose/typegoose";
import { Document } from "mongoose";

@ModelOptions({ schemaOptions: { timestamps: true }, options: { allowMixed: Severity.ALLOW } })
export class Award {
  @Prop({ required: true, type: String })
  title: string;

  @Prop({ required: true, type: String })
  issuer: string;

  @Prop({ required: true, type: String })
  year: string;

  @Prop({ required: true, type: String })
  description: string;

  @Prop({ required: true, type: String })
  badgeImage: string;

  @Prop({ required: true, type: String })
  category: string;
}

export const AwardModel = getModelForClass(Award);
export type AwardDocumentType = Award & Document;
