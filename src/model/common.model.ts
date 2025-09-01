import { Prop } from "@typegoose/typegoose";
import { EducationDegrees } from "../constants";

export class Phone {
  @Prop({ type: String, required: true })
  countryCode: string;

  @Prop({ type: String, required: true })
  number: string;

  @Prop({ required: true, type: String })
  e164: string;
}

export class Address {
  @Prop({ type: String, required: true })
  addressLine1: string;

  @Prop({ type: String, required: false })
  addressLine2?: string;

  @Prop({ type: String, required: false })
  country?: string;

  @Prop({ type: String, required: false })
  city?: string;

  @Prop({ type: String, required: false })
  state?: string;

  @Prop({ type: String, required: false })
  zipCode?: string;
}

export class AddressForDemoRequest {
  @Prop({ type: String, required: true })
  addressLine: string;

  @Prop({ type: String, required: true })
  country: string;

  @Prop({ type: String, required: true })
  city: string;
}

export class ContactPerson {
  @Prop({ type: String, required: true })
  firstName: string;

  @Prop({ type: String, required: false })
  lastName?: string;

  @Prop({ type: String, required: true })
  email: string;

  @Prop({ type: Phone, required: true })
  phone: Phone;

  @Prop({ type: Address, required: true })
  address: Address;
}

export class ContactPersonForDemoRequest {
  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: String, required: true })
  email: string;

  @Prop({ type: Phone, required: true })
  phone: Phone;

  @Prop({ type: AddressForDemoRequest, required: true })
  address: AddressForDemoRequest;
}

export class Experience {
  @Prop({ type: String, required: true })
  companyName: string;

  @Prop({ type: String, required: true })
  designation: string;

  @Prop({ type: String, required: true })
  from: string;

  @Prop({ type: String, required: true })
  to: string;

  @Prop({ type: String, required: false })
  description?: string;

  @Prop({ type: String, required: true })
  city: string;

  @Prop({ type: String, required: true })
  country: string;
}

export class Education {
  @Prop({ type: String, required: true })
  institutionName: string;

  @Prop({ type: String, required: true, enum: EducationDegrees })
  degree: string;

  @Prop({ type: String, required: false, default: null })
  fieldOfStudy?: string;

  @Prop({ type: String, required: true })
  from: string;

  @Prop({ type: String, required: true })
  to: string;

  @Prop({ type: String, required: false })
  description?: string;

  @Prop({ type: String, required: true })
  city: string;

  @Prop({ type: String, required: true })
  country: string;
}

export class Permission {
  @Prop({ type: String, required: true })
  title: string;

  @Prop({ type: String, required: true })
  type: string;

  @Prop({ type: String, required: true })
  description: string;
}

export class Location {
  @Prop({ required: false, type: String, enum: ["Point"], default: "Point" })
  type?: string;

  @Prop({ required: true, type: [Number] })
  coordinates: [number, number]; // [<longitude>, <latitude>]
}

export class DocumentHavingFrontBack {
  @Prop({ required: true, type: String })
  front: string;

  @Prop({ required: true, type: String })
  back: string;
}

export class DocumentHavingNumber {
  @Prop({ required: true, type: String })
  number: string;

  @Prop({ required: false, type: String, default: null })
  fileUrl?: string;
}

export class DocumentHavingNumberWithFrontBack {
  @Prop({ required: true, type: String })
  number: string;

  @Prop({ required: false, type: DocumentHavingFrontBack, _id: false, default: null })
  fileUrl?: DocumentHavingFrontBack;
}
