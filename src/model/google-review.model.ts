import { getModelForClass, ModelOptions, Prop, Severity } from "@typegoose/typegoose";
import { Document } from "mongoose";

class GoogleReviewReply {
  @Prop({ required: true, type: String })
  comment: string;

  @Prop({ required: false, type: Date, default: null })
  updateTime?: Date | null;
}

@ModelOptions({
  schemaOptions: { collection: "google_reviews", timestamps: true },
  options: { allowMixed: Severity.ALLOW }
})
export class GoogleReview {
  // Google's review resource id (last segment of the review `name`). Unique per review.
  @Prop({ required: true, type: String, unique: true })
  googleReviewId: string;

  // Which of our branches this review belongs to (resolved via branch.googleLocationId).
  @Prop({ required: false, type: String, default: null })
  branchId?: string | null;

  // Google location resource (e.g. "locations/123") this review came from.
  @Prop({ required: true, type: String })
  locationName: string;

  @Prop({ required: true, type: String })
  reviewerName: string;

  @Prop({ required: false, type: String, default: null })
  reviewerPhoto?: string | null;

  // 1-5 (converted from Google's ONE..FIVE enum)
  @Prop({ required: true, type: Number })
  starRating: number;

  @Prop({ required: false, type: String, default: null })
  comment?: string | null;

  @Prop({ required: false, type: Date, default: null })
  reviewCreateTime?: Date | null;

  @Prop({ required: false, type: Date, default: null })
  reviewUpdateTime?: Date | null;

  @Prop({ required: false, type: GoogleReviewReply, _id: false, default: null })
  reply?: GoogleReviewReply | null;

  // Moderation: show this review on the public website.
  @Prop({ required: true, type: Boolean, default: false })
  showInWebsite: boolean;

  // Admin "delete"/hide: kept so sync won't resurface it on the dashboard.
  @Prop({ required: true, type: Boolean, default: false })
  isHidden: boolean;
}

export const GoogleReviewModel = getModelForClass(GoogleReview);
export type GoogleReviewModelType = GoogleReview & Document;
