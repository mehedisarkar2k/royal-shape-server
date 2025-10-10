import { DocumentType, getModelForClass, ModelOptions, Prop } from "@typegoose/typegoose";
import { BookingServiceType, BookingStatus } from "../constants";

@ModelOptions({ schemaOptions: { collection: "bookings", timestamps: true } })
export class Booking {
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
}

export const BookingModel = getModelForClass(Booking);
export type BookingDocumentType = DocumentType<Booking>;
