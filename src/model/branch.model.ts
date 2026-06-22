import { DocumentType, getModelForClass, ModelOptions, Prop } from "@typegoose/typegoose";
import { Address, Phone } from "./common.model";
import { BranchStatus } from "../constants";

class OpeningHour {
  @Prop({ required: true, type: String })
  open: string;

  @Prop({ required: true, type: String })
  close: string;
}

export class WeeklySchedule {
  @Prop({ required: true, type: OpeningHour, default: null, _id: false })
  monday: OpeningHour;

  @Prop({ required: true, type: OpeningHour, default: null, _id: false })
  tuesday: OpeningHour;

  @Prop({ required: true, type: OpeningHour, default: null, _id: false })
  wednesday: OpeningHour;

  @Prop({ required: true, type: OpeningHour, default: null, _id: false })
  thursday: OpeningHour;

  @Prop({ required: true, type: OpeningHour, default: null, _id: false })
  friday: OpeningHour;

  @Prop({ required: true, type: OpeningHour, default: null, _id: false })
  saturday: OpeningHour;

  @Prop({ required: true, type: OpeningHour, default: null, _id: false })
  sunday: OpeningHour;
}

@ModelOptions({ schemaOptions: { collection: "branches", timestamps: true } })
export class Branch {
  @Prop({ required: true, type: String })
  name: string;

  @Prop({ required: false, type: String, default: null })
  description?: string | null;

  @Prop({ required: true, type: Phone, _id: false })
  phone: Phone;

  @Prop({ required: true, type: String })
  email: string;

  @Prop({ required: true, type: Address, _id: false })
  address: Address;

  @Prop({ required: true, type: String })
  managerName: string;

  @Prop({ required: true, type: String, enum: BranchStatus })
  status: BranchStatus;

  @Prop({ required: true, type: WeeklySchedule })
  weeklySchedule: WeeklySchedule;

  @Prop({ required: false, type: String, default: null })
  establishedYear?: string | null;

  // Per-branch Google "write a review" deep link (e.g. https://g.page/r/XXXX/review)
  @Prop({ required: false, type: String, default: null })
  googleReviewLink?: string | null;

  // Google Business Profile location resource (e.g. "locations/123") used to sync reviews.
  @Prop({ required: false, type: String, default: null })
  googleLocationId?: string | null;

  @Prop({ required: false, type: Number, default: 0 })
  rating?: number;

  @Prop({ required: true, type: Number })
  latitude: number;

  @Prop({ required: true, type: Number })
  longitude: number;
}

export const BranchModel = getModelForClass(Branch);
export type BranchDocumentType = DocumentType<Branch>;
