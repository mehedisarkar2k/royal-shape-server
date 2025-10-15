import { ModelOptions, Prop } from "@typegoose/typegoose";
import { v4 as uuid } from "uuid";
import { Phone } from "./common.model";

class SocialInfo {
  @Prop({ required: false, type: String, default: null })
  facebook?: string | null;

  @Prop({ required: false, type: String, default: null })
  youtube?: string | null;

  @Prop({ required: false, type: String, default: null })
  instagram?: string | null;

  @Prop({ required: false, type: String, default: null })
  linkedin?: string | null;

  @Prop({ required: false, type: String, default: null })
  twitter?: string | null;

  @Prop({ required: false, type: String, default: null })
  tiktok?: string | null;
}

class CtaButton {
  @Prop({ required: true, type: String })
  text: string;

  @Prop({ required: true, type: String })
  link: string;
}

class HeroSection {
  @Prop({ required: true, type: String })
  title: string;

  @Prop({ required: true, type: String })
  subtitle: string;

  @Prop({ required: true, type: CtaButton, _id: false })
  ctaButton1: CtaButton;

  @Prop({ required: true, type: CtaButton, _id: false })
  ctaButton2: CtaButton;

  @Prop({ required: true, type: String })
  image: string;
}

class BodySection {
  @Prop({ required: true, type: String, default: () => uuid() })
  id: string;

  @Prop({ required: true, type: String })
  title: string;

  @Prop({ required: true, type: String })
  content: string;

  @Prop({ required: false, type: String, default: null })
  image?: string | null;
}

class WebsiteHomeInfo {
  @Prop({ required: true, type: HeroSection, _id: false })
  heroSection: HeroSection;

  @Prop({ required: true, type: Boolean })
  isPromotionBannerEnabled: boolean;

  @Prop({ required: false, type: Array<string>, default: [] })
  promotionBanners?: string[];
}

class WebsiteServiceInfo {
  @Prop({ required: true, type: String, default: () => uuid() })
  id: string;

  @Prop({ required: true, type: String })
  serviceId: string;

  @Prop({ required: true, type: HeroSection, _id: false })
  heroSection: HeroSection;

  @Prop({ required: true, type: Array<BodySection>, _id: false })
  bodySections: BodySection[];
}

class WebsiteAboutInfo {
  @Prop({ required: true, type: Array<BodySection>, _id: false })
  bodySections: BodySection[];
}

class WebsiteInfo {
  @Prop({ required: true, type: WebsiteHomeInfo, _id: false })
  home: WebsiteHomeInfo;

  @Prop({ required: true, type: Array<WebsiteServiceInfo>, _id: false })
  services: WebsiteServiceInfo[];

  @Prop({ required: true, type: WebsiteAboutInfo, _id: false })
  about: WebsiteAboutInfo;
}

@ModelOptions({ schemaOptions: { collection: "business_info", timestamps: true } })
export class BusinessInfo {
  @Prop({ required: true, type: String })
  name: string;

  @Prop({ required: false, type: String, default: null })
  description?: string | null;

  @Prop({ required: true, type: String })
  address: string;

  @Prop({ required: true, type: Phone })
  phone: Phone;

  @Prop({ required: true, type: String })
  email: string;

  @Prop({ required: true, type: String })
  ownerName: string;

  @Prop({ required: true, type: String })
  logo: string;

  @Prop({ required: true, type: SocialInfo, _id: false })
  socialInfo: SocialInfo;

  @Prop({ required: true, type: WebsiteInfo, _id: false })
  websiteInfo: WebsiteInfo;
}
