import { DocumentType, getModelForClass, ModelOptions, Prop } from "@typegoose/typegoose";
import { BookingServiceType, BookingStatus } from "../constants";

@ModelOptions({ schemaOptions: { collection: "bookings", timestamps: true } })
export class Booking {
  @Prop({ required: true, type: String })
  shortId: string;

  @Prop({ required: true, type: String })
  customerId: string;

  @Prop({ required: true, type: String, enum: BookingServiceType })
  serviceType: BookingServiceType;

  @Prop({ required: false, type: Array<string>, default: null })
  serviceIds?: string[] | null;

  @Prop({ required: false, type: String, default: null })
  comboId?: string | null;

  @Prop({ required: true, type: String })
  branchId: string;

  @Prop({ required: true, type: String })
  branchName: string;

  @Prop({ required: true, type: Date })
  bookingDate: Date;

  @Prop({ required: true, type: String })
  startTime: string;

  @Prop({ required: true, type: String })
  endTime: string;

  @Prop({ required: true, type: Number })
  totalPrice: number;

  @Prop({ required: false, type: Number, default: null })
  discount?: number | null;

  @Prop({ required: false, type: String, default: null })
  notes?: string | null;

  @Prop({ required: true, type: String, enum: BookingStatus })
  status: BookingStatus;

  // Reason the admin gave when cancelling/rejecting; shown to the customer.
  @Prop({ required: false, type: String, default: null })
  cancellationReason?: string | null;

  @Prop({ required: false, type: Boolean, default: false })
  isGuestBooking?: boolean;

  @Prop({ required: false, type: String, default: null })
  receiptKey?: string | null;
}

export const BookingModel = getModelForClass(Booking);
export type BookingDocumentType = DocumentType<Booking>;
