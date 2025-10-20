import { Request, Response } from "express";
import { v4 as uuid } from "uuid";
import { SendErrorResponse, SendResponse } from "../utils";
import { BusinessInfoModel, WeeklySchedule } from "../model";
import { ApplicationServices, DATA_NOT_FOUND } from "../constants";
import {
  findAllBranches,
  findAllEmployeesPaginated,
  findAllServiceCategories,
  findServicesByCategoryId
} from "../services";
import { ReviewModel } from "../model/review.model";

const buildErrorPayload = (
  endpoint: string,
  functionName: string,
  method: string,
  message: string,
  error: { code: string; message: string },
  customMsg: string
) => ({
  message,
  data: {
    clientError: { ...error, message: customMsg },
    endpoint,
    functionName,
    method,
    service: ApplicationServices.WEBSITE,
    id: uuid()
  }
});

function toAmPm(time: string | null): string {
  if (!time) return "";
  const [hourStr, minuteStr] = time.split(":");
  let hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  hour = hour % 12 || 12;
  return `${hour}${minute ? ":" + minute.toString().padStart(2, "0") : ""}${ampm}`;
}

function formatWeeklySchedule(schedule: WeeklySchedule): string {
  const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;
  const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const timeStrings = days.map((d) => {
    const oh = schedule[d];
    if (!oh?.open || !oh?.close) return "Closed";
    return `${toAmPm(oh.open)}-${toAmPm(oh.close)}`;
  });

  const groups: { range: string; time: string }[] = [];
  let start = 0;

  while (start < days.length) {
    const currentTime = timeStrings[start];
    let end = start;
    while (end + 1 < days.length && timeStrings[end + 1] === currentTime) end++;
    const range = start === end ? labels[start] : `${labels[start]}-${labels[end]}`;
    groups.push({ range, time: currentTime });
    start = end + 1;
  }

  return groups.map((g) => (g.time === "Closed" ? `${g.range}: Closed` : `${g.range}: ${g.time}`)).join(", ");
}

export async function getWebsiteHomePublicDataHandler(req: Request, res: Response) {
  const functionName = getWebsiteHomePublicDataHandler.name;
  const businessInfo = await BusinessInfoModel.findOne();
  if (!businessInfo) {
    return SendErrorResponse.notFound({
      res,
      ...buildErrorPayload(
        req.originalUrl,
        functionName,
        req.method,
        "Business info not found",
        DATA_NOT_FOUND,
        "Business info document not found"
      )
    });
  }

  const websiteInfo = businessInfo.websiteInfo;
  if (!websiteInfo) {
    return SendErrorResponse.notFound({
      res,
      ...buildErrorPayload(
        req.originalUrl,
        functionName,
        req.method,
        "Website info not found",
        DATA_NOT_FOUND,
        "This website may not have been set up yet. Sorry for the inconvenience. Please contact the site administrator."
      )
    });
  }

  const homeData = websiteInfo.home;
  if (!homeData) {
    return SendErrorResponse.notFound({
      res,
      ...buildErrorPayload(
        req.originalUrl,
        functionName,
        req.method,
        "Website home data not found",
        DATA_NOT_FOUND,
        "This website may not have been set up yet. Sorry for the inconvenience. Please contact the site administrator."
      )
    });
  }

  const serviceCategories = await findAllServiceCategories();
  const services = serviceCategories.map((category) => ({
    id: category._id.toString(),
    name: category.name,
    description: category.description,
    image: category.thumbnail
  }));

  const employees = await findAllEmployeesPaginated(1, 4);
  const experts = employees.map((employee) => ({
    id: employee._id.toString(),
    name: employee.name,
    designation: employee.jobRole,
    profileImage: employee.profileImage,
    specialization:
      employee.specialization?.length === 0 ? ["Modern Patterns", "Special Events"] : employee.specialization,
    rating: employee.rating || 5
  }));

  const branches = await findAllBranches();
  const finalBranches = branches.map((branch) => {
    const openingHourStr = formatWeeklySchedule(branch.weeklySchedule);
    return {
      id: branch._id.toString(),
      name: branch.name,
      address: branch.address,
      phone: branch.phone,
      email: branch.email,
      rating: branch.rating,
      openingHours: openingHourStr
    };
  });

  const showcase =
    websiteInfo.showcase && websiteInfo.showcase.length > 0
      ? websiteInfo.showcase
      : [
          {
            id: 1,
            altText: "Showcase Image 1",
            url: "https://pub-143c0179908045b5806a90fec6b91bae.r2.dev/website-images/1760513743423-7bf4a5d3-e979-43e3-bf6f-1d4f54d07476-1760513743418---threading.png"
          },
          {
            id: 2,
            altText: "Showcase Image 2",
            url: "https://pub-143c0179908045b5806a90fec6b91bae.r2.dev/website-images/1760513743423-7bf4a5d3-e979-43e3-bf6f-1d4f54d07476-1760513743418---threading.png"
          },
          {
            id: 3,
            altText: "Showcase Image 3",
            url: "https://pub-143c0179908045b5806a90fec6b91bae.r2.dev/website-images/1760513743423-7bf4a5d3-e979-43e3-bf6f-1d4f54d07476-1760513743418---threading.png"
          }
        ];

  const reviews = await ReviewModel.find({ showInWebsite: true }).sort({ rating: -1 }).limit(5);
  const testimonials = reviews.map((review) => ({
    id: review._id.toString(),
    customerName: review.customerName,
    customerImage: review.customerImage,
    rating: review.rating,
    comment: review.comment
  }));

  return SendResponse.success({
    res,
    message: "Website home public data fetched successfully",
    data: {
      hero: {
        chipText: homeData.heroSection.chipText || "Experience Luxury",
        title: homeData.heroSection.title || "Elevate Your Beauty",
        subtitle:
          homeData.heroSection.subtitle ||
          "Experience premium beauty services delivered by our expert team for a transformative look",
        image: homeData.heroSection.image,
        ctaButton1: homeData.heroSection.ctaButton1,
        ctaButton2: homeData.heroSection.ctaButton2
      },
      promotions: [
        // TODO: fetch from DB later
        {
          id: 1,
          title: "Limited Time Offer",
          description: "Get 20% off on your first purchase",
          image:
            "https://pub-143c0179908045b5806a90fec6b91bae.r2.dev/website-images/1760513743423-7bf4a5d3-e979-43e3-bf6f-1d4f54d07476-1760513743418---threading.png",
          buttonText: "Book Now",
          buttonLink: "https://example.com/promo1"
        },
        {
          id: 2,
          title: "Free Shipping",
          description: "Enjoy free shipping on orders over $50",
          image:
            "https://pub-143c0179908045b5806a90fec6b91bae.r2.dev/website-images/1760513743423-7bf4a5d3-e979-43e3-bf6f-1d4f54d07476-1760513743418---threading.png",
          buttonText: "Shop Now",
          buttonLink: "https://example.com/promo2"
        }
      ],
      servicesCategories: services,
      experts,
      branches: finalBranches,
      showcase,
      testimonials
    }
  });
}

export async function getWebsiteFooterPublicDataHandler(req: Request, res: Response) {
  const functionName = getWebsiteFooterPublicDataHandler.name;
  const businessInfo = await BusinessInfoModel.findOne();
  if (!businessInfo) {
    return SendErrorResponse.notFound({
      res,
      ...buildErrorPayload(
        req.originalUrl,
        functionName,
        req.method,
        "Business info not found",
        DATA_NOT_FOUND,
        "This website may not have been set up yet. Sorry for the inconvenience. Please contact the site administrator."
      )
    });
  }

  const socialInfo = businessInfo.socialInfo;
  if (!socialInfo) {
    return SendErrorResponse.notFound({
      res,
      ...buildErrorPayload(
        req.originalUrl,
        functionName,
        req.method,
        "Social info not found",
        DATA_NOT_FOUND,
        "This website may not have been set up yet. Sorry for the inconvenience. Please contact the site administrator."
      )
    });
  }

  const footerData = {
    businessName: businessInfo.name || "Royal Threading & Beauty",
    businessDescription: businessInfo.description || "Elevating your natural beauty with professional beauty services.",
    logo: businessInfo.logo,
    socials: {
      facebook: socialInfo.facebook || "",
      instagram: socialInfo.instagram || "",
      twitter: socialInfo.twitter || "",
      linkedin: socialInfo.linkedin || "",
      youtube: socialInfo.youtube || "",
      tiktok: socialInfo.tiktok || ""
    },
    copyRightMsg: businessInfo.copyRightMsg || "© 2025 Royal Threading & Beauty. All rights reserved.",
    contact: {
      phone: businessInfo.phone,
      email: businessInfo.email,
      address: businessInfo.address
    }
  };

  return SendResponse.success({
    res,
    message: "Website footer public data fetched successfully",
    data: footerData
  });
}

export async function getWebsiteServicesPageDataHandler(req: Request, res: Response) {
  // const functionName = getWebsiteServicesPageDataHandler.name;

  const serviceCategories = await findAllServiceCategories();
  const finalServicesCategories = (serviceCategories || []).map((category) => ({
    id: category._id.toString(),
    name: category.name,
    description: category.description,
    image: category.thumbnail
  }));

  return SendResponse.success({
    res,
    message: "Website services page public data fetched successfully",
    data: {
      services: finalServicesCategories,
      combos: [
        // TODO: fetch from DB later
        {
          name: "Basic Package",
          description: "Perfect for beginners who want to try our services",
          price: 120,
          mostPopular: false,
          currency: "AUD",
          features: ["Eyebrow Threading & Tinting", "Express Facial", "Classic Manicure"]
        },
        {
          name: "Premium Package",
          description: "Our most popular package for complete beauty experience",
          price: 220,
          currency: "AUD",
          mostPopular: true,
          features: [
            "Full Face Threading & Tinting",
            "Deluxe Facial Treatment",
            "Eyelash Extensions",
            "Henna Design (Small)"
          ]
        },
        {
          name: "Luxury Package",
          description: "Ultimate beauty transformation for special occasions",
          price: 350,
          currency: "AUD",
          mostPopular: false,
          features: [
            "Complete Threading & Tinting",
            "Premium Facial & Massage",
            "Professional Makeup",
            "Eyelash Extensions & Lifting",
            "Elaborate Henna Design"
          ]
        }
      ]
    }
  });
}

export async function getWebsitePricingPageDataHandler(req: Request, res: Response) {
  // const functionName = getWebsitePricingPageDataHandler.name;

  const serviceCategories = await findAllServiceCategories();
  const finalServicesCategories = await Promise.all(
    serviceCategories.map(async (category) => {
      const services = await findServicesByCategoryId(category._id.toString());

      return {
        categoryId: category._id.toString(),
        categoryName: category.name,
        services: services.map((service) => ({
          id: service._id.toString(),
          name: service.name,
          description: service.description,
          price: service.price,
          duration: service.duration,
          image: service.thumbnail
        }))
      };
    })
  );

  return SendResponse.success({
    res,
    message: "Website pricing page data fetched successfully",
    data: {
      individualServices: {
        serviceCategories: finalServicesCategories
      },
      serviceCombos: [
        // TODO: fetch from DB later
        {
          name: "Basic Package",
          description: "Perfect for beginners who want to try our services",
          price: 120,
          mostPopular: false,
          currency: "AUD",
          features: ["Eyebrow Threading & Tinting", "Express Facial", "Classic Manicure"]
        },
        {
          name: "Premium Package",
          description: "Our most popular package for complete beauty experience",
          price: 220,
          currency: "AUD",
          mostPopular: true,
          features: [
            "Full Face Threading & Tinting",
            "Deluxe Facial Treatment",
            "Eyelash Extensions",
            "Henna Design (Small)"
          ]
        },
        {
          name: "Luxury Package",
          description: "Ultimate beauty transformation for special occasions",
          price: 350,
          currency: "AUD",
          mostPopular: false,
          features: [
            "Complete Threading & Tinting",
            "Premium Facial & Massage",
            "Professional Makeup",
            "Eyelash Extensions & Lifting",
            "Elaborate Henna Design"
          ]
        }
      ]
    }
  });
}

export async function getWebsiteAboutPageDataHandler(req: Request, res: Response) {
  const functionName = getWebsiteAboutPageDataHandler.name;
  const businessInfo = await BusinessInfoModel.findOne();
  if (!businessInfo) {
    return SendErrorResponse.notFound({
      res,
      ...buildErrorPayload(
        req.originalUrl,
        functionName,
        req.method,
        "Business info not found",
        DATA_NOT_FOUND,
        "This website may not have been set up yet. Sorry for the inconvenience. Please contact the site administrator."
      )
    });
  }

  const websiteInfo = businessInfo.websiteInfo;
  if (!websiteInfo) {
    return SendErrorResponse.notFound({
      res,
      ...buildErrorPayload(
        req.originalUrl,
        functionName,
        req.method,
        "Website info not found",
        DATA_NOT_FOUND,
        "This website may not have been set up yet. Sorry for the inconvenience. Please contact the site administrator."
      )
    });
  }

  const aboutData = websiteInfo.about;
  if (!aboutData) {
    return SendErrorResponse.notFound({
      res,
      ...buildErrorPayload(
        req.originalUrl,
        functionName,
        req.method,
        "Website about data not found",
        DATA_NOT_FOUND,
        "This website may not have been set up yet. Sorry for the inconvenience. Please contact the site administrator."
      )
    });
  }

  const employees = await findAllEmployeesPaginated(1, 4);
  const experts = employees.map((employee) => ({
    id: employee._id.toString(),
    name: employee.name,
    designation: employee.jobRole,
    profileImage: employee.profileImage,
    specialization:
      !employee.specialization || employee.specialization?.length === 0
        ? ["Modern Patterns", "Special Events"]
        : employee.specialization,
    rating: employee.rating || 5
  }));

  const branches = await findAllBranches();
  const finalBranches = branches.map((branch) => {
    const openingHourStr = formatWeeklySchedule(branch.weeklySchedule);
    return {
      id: branch._id.toString(),
      name: branch.name,
      address: branch.address,
      phone: branch.phone,
      email: branch.email,
      rating: branch.rating,
      openingHours: openingHourStr
    };
  });

  return SendResponse.success({
    res,
    message: "Website about page public data fetched successfully",
    data: {
      bodySections: aboutData.bodySections,
      ourValues: {
        // TODO: fetch from DB later
        card1: {
          title: "Excellence",
          description:
            "We are committed to delivering exceptional service and results that exceed your expectations every time."
        },
        card2: {
          title: "Authenticity",
          description:
            "We honor traditional beauty techniques while embracing modern innovations to create authentic experiences."
        },
        card3: {
          title: "Personalization",
          description:
            "Every client is unique, and we tailor our services to meet your individual needs and preferences."
        },
        card4: {
          title: "Sustainability",
          description:
            "We are committed to eco-friendly practices and sustainable beauty solutions for a better tomorrow."
        },
        card5: {
          title: "Innovation",
          description:
            "We continuously evolve our techniques and services to stay at the forefront of the beauty industry."
        },
        card6: {
          title: "Community",
          description:
            "We believe in building strong relationships with our clients and contributing positively to our community."
        }
      },
      joinOurJourneySocials: {
        facebook: businessInfo.socialInfo.facebook || "",
        instagram: businessInfo.socialInfo.instagram || "",
        tiktok: businessInfo.socialInfo.tiktok || ""
      },
      branches: finalBranches,
      experts
    }
  });
}
