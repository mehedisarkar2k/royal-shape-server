import { getModelForClass, ModelOptions, Prop, Severity } from "@typegoose/typegoose";
import { Document } from "mongoose";

@ModelOptions({
  schemaOptions: {
    collection: "promotions",
    timestamps: true
  },
  options: { allowMixed: Severity.ALLOW }
})
export class Promotion {
  @Prop({ required: true, type: String })
  title: string;

  @Prop({ required: true, type: String })
  titleColor: string;

  @Prop({ required: true, type: String })
  description: string;

  @Prop({ required: true, type: String })
  descriptionColor: string;

  @Prop({ required: true, type: String })
  bannerImage: string;

  @Prop({ required: true, type: String })
  buttonText: string;

  @Prop({ required: true, type: String })
  buttonBgColor: string;

  @Prop({ required: true, type: String })
  buttonTextColor: string;

  @Prop({ required: true, type: String })
  buttonLink: string;

  @Prop({ required: true, default: true, type: Boolean })
  isActive: boolean;

  @Prop()
  createdAt?: Date;
}

export const PromotionModel = getModelForClass(Promotion);
export type PromotionType = Promotion & Document;
