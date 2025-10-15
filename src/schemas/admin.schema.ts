import { array, object, string, TypeOf } from "zod";

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
