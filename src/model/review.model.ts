import { getModelForClass, ModelOptions, Prop } from "@typegoose/typegoose";
import { Document } from "mongoose";

@ModelOptions({ schemaOptions: { collection: "reviews", timestamps: true }, options: { allowMixed: 0 } })
export class Review {
  @Prop({ required: true })
  customerName: string;

  @Prop({ required: false, default: null })
  customerEmail?: string;

  @Prop({ required: false, type: String, default: null })
  customerImage?: string;

  @Prop({ required: true })
  rating: number;

  @Prop({ required: true })
  comment: string;

  @Prop({ required: true, default: true })
  showInWebsite: boolean;

  @Prop({ required: false, default: Date.now })
  createdAt?: Date;
}

export const ReviewModel = getModelForClass(Review);
export type ReviewModelType = Review & Document;
