import { array, object, string, TypeOf } from "zod";
import { phoneSchema } from "./common.schema";

export const postWebsiteHomeDataSchema = object({
  body: object({
    heroSection: object({
      chipText: string().min(0).max(50).optional(),
      title: string().min(1).max(100),
      subtitle: string().min(1),
      ctaButton1: object({
        text: string().min(1),
        link: string().min(1)
      }),
      ctaButton2: object({
        text: string().min(1),
        link: string().min(1)
      }),
      image: string().min(1)
    })
  })
});
export type PostWebsiteHomeDataType = TypeOf<typeof postWebsiteHomeDataSchema>["body"];

export const postWebsiteServiceDataSchema = object({
  body: object({
    heroSection: object({
      title: string().min(1),
      subtitle: string().min(1),
      image: string().min(1),
      ctaButton1: object({
        text: string().min(1),
        link: string().min(1)
      }),
      ctaButton2: object({
        text: string().min(1),
        link: string().min(1)
      })
    }),
    bodySections: array(
      object({
        title: string().min(1),
        content: string().min(1),
        image: string().min(1)
      })
    ).min(1)
  })
});
export type PostWebsiteServiceDataType = TypeOf<typeof postWebsiteServiceDataSchema>["body"];

export const postWebsiteAboutDataSchema = object({
  body: object({
    bodySections: array(
      object({
        title: string().min(1),
        content: string().min(1),
        image: string().min(1)
      })
    ).min(1)
  })
});
export type PostWebsiteAboutDataType = TypeOf<typeof postWebsiteAboutDataSchema>["body"];

export const postGeneralSettingsDataSchema = object({
  body: object({
    logo: string().min(1),
    businessName: string().min(1),
    ownerName: string().min(1),
    businessAddress: string().min(1),
    phoneNumber: phoneSchema,
    email: string().min(1).email()
  })
});
export type PostGeneralSettingsDataType = TypeOf<typeof postGeneralSettingsDataSchema>["body"];

export const postSocialMediaLinksDataSchema = object({
  body: object({
    facebook: string().min(1).optional(),
    twitter: string().min(1).optional(),
    instagram: string().min(1).optional(),
    linkedin: string().min(1).optional(),
    youtube: string().min(1).optional(),
    tiktok: string().min(1).optional()
  })
});
export type PostSocialMediaLinksDataType = TypeOf<typeof postSocialMediaLinksDataSchema>["body"];
