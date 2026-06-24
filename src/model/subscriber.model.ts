import { getModelForClass, ModelOptions, Prop } from "@typegoose/typegoose";
import { Document } from "mongoose";

export enum SubscriberStatus {
  SUBSCRIBED = "subscribed",
  UNSUBSCRIBED = "unsubscribed"
}

@ModelOptions({ schemaOptions: { collection: "subscribers", timestamps: true } })
export class Subscriber {
  @Prop({ required: true, type: String, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true, type: String, enum: SubscriberStatus, default: SubscriberStatus.SUBSCRIBED })
  status: SubscriberStatus;

  // Token for one-click unsubscribe links.
  @Prop({ required: true, type: String })
  unsubscribeToken: string;

  // Where the subscription came from (e.g. "footer").
  @Prop({ required: false, type: String, default: "website" })
  source?: string;

  @Prop({ required: false, type: Date })
  createdAt?: Date;
}

export const SubscriberModel = getModelForClass(Subscriber);
export type SubscriberModelType = Subscriber & Document;
