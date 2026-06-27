import { Request, Response } from "express";
import { isValidObjectId } from "mongoose";
import { v4 as uuid } from "uuid";
import { appCache, SendErrorResponse, SendResponse } from "../utils";
import { BlogModel, BusinessInfoModel, PromotionModel, WeeklySchedule, WebsiteServiceInfo } from "../model";
import { ApplicationServices, BlogStatus, DATA_NOT_FOUND, INPUT_MISSING, UNEXPECTED_ERROR } from "../constants";
import {
  findAllAwardsPaginated,
  findAllBranches,
  findAllCareerPosts,
  findAllCombos,
  findAllCombosOfBranch,
  findAllEmployeesPaginated,
  findAllServiceCategories,
  findAllServiceCategoriesOfBranch,
  findBranchById,
  findCareerPostById,
  findServicesByCategoryId,
  findServiceCategoryById,
  findActiveServicesByCategoryIdAndBranch
} from "../services";
import { ReviewModel } from "../model/review.model";
import { ApplyCareerPostType, SubmitReviewInput } from "../schemas";
import { uploadFileR2WithAutoKey } from "../services/r2-storage.service";
import { DateTime } from "luxon";

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

  const cacheKey = "website_home_data";
  const cachedData = appCache.get(cacheKey);
  if (cachedData) {
    return SendResponse.success({
      res,
      message: "Website home public data fetched successfully (from cache)",
      data: cachedData
    });
  }

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
  const services = await Promise.all(
    serviceCategories.map(async (category) => {
      const categoryServices = await findServicesByCategoryId(category._id.toString());
      return {
        id: category._id.toString(),
        name: category.name,
        description: category.description,
        image: category.thumbnail,
        prices: categoryServices.map((service) => ({
          name: service.name,
          price: `$${service.price}`,
          duration: service.duration,
          description: service.description
        }))
      };
    })
  );

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
      openingHours: openingHourStr,
      latitude: branch.latitude,
      longitude: branch.longitude
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

  const promotions = await PromotionModel.find({ isActive: true }).sort({ createdAt: -1 });

  const awards = await findAllAwardsPaginated(1, 10);
  const finalAwards = awards.map((award) => ({
    id: award._id.toString(),
    title: award.title,
    issuer: award.issuer,
    year: award.year,
    description: award.description,
    badgeImage: award.badgeImage,
    category: award.category
  }));

  const comboServices = await findAllCombos();
  const nowTs = Date.now();
  const finalComboServices = comboServices
    // Hide quick offerings whose expiry has passed.
    .filter((combo) => !(combo.isQuickOffering && combo.expiresAt && new Date(combo.expiresAt).getTime() < nowTs))
    .map((combo) => ({
      id: combo._id.toString(),
      name: combo.name,
      description: combo.description,
      price: combo.price,
      currency: combo.currency,
      features: combo.comboItems,
      isQuickOffering: combo.isQuickOffering ?? false,
      expiresAt: combo.expiresAt ?? null,
      mostPopular: false
    }));
  if (finalComboServices.length > 1) {
    finalComboServices[1].mostPopular = true;
  }

  const responseData = {
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
    promotions: promotions.map((promo) => ({
      id: promo._id.toString(),
      title: promo.title,
      titleColor: promo.titleColor,
      description: promo.description,
      descriptionColor: promo.descriptionColor,
      image: promo.bannerImage,
      buttonText: promo.buttonText,
      buttonBgColor: promo.buttonBgColor,
      buttonTextColor: promo.buttonTextColor,
      buttonLink: promo.buttonLink
    })),
    combos: finalComboServices,
    servicesCategories: services,
    awards: finalAwards,
    experts,
    branches: finalBranches,
    showcase,
    testimonials
  };

  appCache.set(cacheKey, responseData);

  return SendResponse.success({
    res,
    message: "Website home public data fetched successfully",
    data: responseData
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

  const branches = await findAllBranches();
  const finalBranches = branches.map((branch) => ({
    id: branch._id.toString(),
    name: branch.name,
    address: branch.address,
    phone: branch.phone,
    email: branch.email
  }));

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
    copyRightMsg: (
      businessInfo.copyRightMsg || `© ${new Date().getFullYear()} Royal Threading & Beauty. All rights reserved.`
    ).replace(/20\d{2}/, new Date().getFullYear().toString()),
    contact: {
      phone: businessInfo.phone,
      email: businessInfo.email,
      address: businessInfo.address
    },
    branches: finalBranches
  };

  return SendResponse.success({
    res,
    message: "Website footer public data fetched successfully",
    data: footerData
  });
}

export async function getWebsiteServicesPageDataHandler(req: Request, res: Response) {
  // const functionName = getWebsiteServicesPageDataHandler.name;

  const cacheKey = "website_services_page_data";
  const cachedData = appCache.get(cacheKey);
  if (cachedData) {
    return SendResponse.success({
      res,
      message: "Website services page public data fetched successfully (from cache)",
      data: cachedData
    });
  }

  const serviceCategories = await findAllServiceCategories();
  const finalServicesCategories = await Promise.all(
    (serviceCategories || []).map(async (category) => {
      const services = await findServicesByCategoryId(category._id.toString());
      return {
        id: category._id.toString(),
        name: category.name,
        description: category.description,
        image: category.thumbnail,
        prices: services.map((service) => ({
          name: service.name,
          price: `$${service.price}`,
          duration: service.duration,
          description: service.description
        }))
      };
    })
  );

  const comboServices = await findAllCombos();
  const nowTs = Date.now();
  const finalComboServices = comboServices
    // Hide quick offerings whose expiry has passed.
    .filter((combo) => !(combo.isQuickOffering && combo.expiresAt && new Date(combo.expiresAt).getTime() < nowTs))
    .map((combo) => ({
      id: combo._id.toString(),
      name: combo.name,
      description: combo.description,
      price: combo.price,
      currency: combo.currency,
      features: combo.comboItems,
      isQuickOffering: combo.isQuickOffering ?? false,
      expiresAt: combo.expiresAt ?? null,
      mostPopular: false
    }));
  if (finalComboServices.length > 1) {
    finalComboServices[1].mostPopular = true;
  }

  const responseData = {
    services: finalServicesCategories,
    combos: finalComboServices
  };

  appCache.set(cacheKey, responseData);

  return SendResponse.success({
    res,
    message: "Website services page public data fetched successfully",
    data: responseData
  });
}

export async function getWebsiteSingleServicePageDataHandler(req: Request, res: Response) {
  const functionName = getWebsiteSingleServicePageDataHandler.name;
  const { serviceId } = req.params;

  const cacheKey = `website_single_service_data_${serviceId}`;
  const cachedData = appCache.get(cacheKey);
  if (cachedData) {
    return SendResponse.success({
      res,
      message: "Website single service page public data fetched successfully (from cache)",
      data: cachedData
    });
  }

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

  const services = websiteInfo.services;
  if (!services) {
    return SendErrorResponse.notFound({
      res,
      ...buildErrorPayload(
        req.originalUrl,
        functionName,
        req.method,
        "Website services data not found",
        DATA_NOT_FOUND,
        "This website may not have been set up yet. Sorry for the inconvenience. Please contact the site administrator."
      )
    });
  }

  type FallbackServiceData = {
    serviceId: string;
    serviceName: string;
    heroSection: Partial<WebsiteServiceInfo["heroSection"]>;
    bodySections: WebsiteServiceInfo["bodySections"];
  };

  let serviceData: WebsiteServiceInfo | FallbackServiceData | undefined = services.find(
    (s) => s.serviceId === serviceId
  );
  if (!serviceData) {
    // Fallback to ServiceCategory if specific single-service details are missing
    const category = await findServiceCategoryById(serviceId);
    if (!category) {
      return SendErrorResponse.notFound({
        res,
        ...buildErrorPayload(
          req.originalUrl,
          functionName,
          req.method,
          `No service found with the ID: ${serviceId}`,
          DATA_NOT_FOUND,
          "This service category does not exist."
        )
      });
    }
    serviceData = {
      serviceId: category._id.toString(),
      serviceName: category.name,
      heroSection: {
        title: category.name,
        subtitle: category.description ?? undefined,
        image:
          category.thumbnail ||
          "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=1920&q=80"
      },
      bodySections: []
    };
  }

  const serviceItems = await findServicesByCategoryId(serviceId);
  const serviceItemsFormatted = serviceItems.map((service) => ({
    id: service._id.toString(),
    name: service.name,
    description: service.description,
    price: service.price,
    duration: service.duration,
    image: service.thumbnail
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
      openingHours: openingHourStr,
      latitude: branch.latitude,
      longitude: branch.longitude
    };
  });

  // const reviews = await ReviewModel.find({ showInWebsite: true }).sort({ rating: -1 }).limit(5);
  // const testimonials = reviews.map((review) => ({
  //   id: review._id.toString(),
  //   customerName: review.customerName,
  //   customerImage: review.customerImage,
  //   rating: review.rating,
  //   comment: review.comment
  // }));

  const responseData = {
    service: {
      id: serviceData.serviceId,
      name: serviceData.serviceName,
      heroSection: serviceData.heroSection,
      bodySections: serviceData.bodySections,
      serviceItemsWeProvide: serviceItemsFormatted,
      experts: experts,
      branches: finalBranches
      // testimonials: testimonials
    }
  };

  appCache.set(cacheKey, responseData);

  return SendResponse.success({
    res,
    message: "Website single service page public data fetched successfully",
    data: responseData
  });
}

export async function getWebsitePricingPageDataHandler(req: Request, res: Response) {
  const cacheKey = `website_pricing_page_data`;
  const cachedData = appCache.get(cacheKey);
  if (cachedData) {
    return SendResponse.success({
      res,
      message: "Website pricing page data fetched successfully (cached)",
      data: cachedData
    });
  }

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

  const comboServices = await findAllCombos();
  const nowTs = Date.now();
  const finalComboServices = comboServices
    // Hide quick offerings whose expiry has passed.
    .filter((combo) => !(combo.isQuickOffering && combo.expiresAt && new Date(combo.expiresAt).getTime() < nowTs))
    .map((combo) => ({
      id: combo._id.toString(),
      name: combo.name,
      description: combo.description,
      price: combo.price,
      currency: combo.currency,
      features: combo.comboItems,
      isQuickOffering: combo.isQuickOffering ?? false,
      expiresAt: combo.expiresAt ?? null,
      mostPopular: false
    }));
  if (finalComboServices.length > 1) {
    finalComboServices[1].mostPopular = true;
  }

  const responseData = {
    individualServices: {
      serviceCategories: finalServicesCategories
    },
    serviceCombos: finalComboServices
  };

  appCache.set(cacheKey, responseData);

  return SendResponse.success({
    res,
    message: "Website pricing page data fetched successfully",
    data: responseData
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

  const awards = await findAllAwardsPaginated(1, 10);
  const finalAwards = awards.map((award) => ({
    id: award._id.toString(),
    title: award.title,
    issuer: award.issuer,
    year: award.year,
    description: award.description,
    badgeImage: award.badgeImage,
    category: award.category
  }));

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
      experts,
      awards: finalAwards
    }
  });
}

export async function getWebsiteCareersPageDataHandler(req: Request, res: Response) {
  const functionName = getWebsiteCareersPageDataHandler.name;

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

  const homeData = websiteInfo.home;

  const openPositions = await findAllCareerPosts();
  const finalOpenPositions = openPositions.map((post) => ({
    id: post._id.toString(),
    jobTitle: post.jobTitle,
    jobDescription: post.jobDescription,
    employmentType: post.employmentType,
    department: post.department
  }));

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
    message: "Website careers page public data fetched successfully",
    data: {
      hero: {
        // TODO: change later to careers specific data
        chipText: "Experience Luxury",
        title: "Join Our Team of Beauty Professionals",
        subtitle:
          "Build your career in creative and dynamic environment where talent meets opportunity and excellence is our standard.",
        image: homeData.heroSection.image, // TODO: change it
        ctaButton1: {
          link: "/career#open-positions",
          text: "View Open Positions"
        },
        ctaButton2: {
          link: "/career#our-culture",
          text: "Our Culture"
        }
      },
      numberSections: {
        // TODO: change later to careers specific data
        yearOfExcellence: 10,
        teamMembers: 12,
        happyClients: 1000,
        branches: 5
      },
      openPositions: finalOpenPositions,
      experts,
      testimonials
    }
  });
}

export async function getSingleCareerPostPublicDataHandler(req: Request, res: Response) {
  const functionName = getSingleCareerPostPublicDataHandler.name;
  const { careerId } = req.params;

  const jobPost = await findCareerPostById(careerId);
  if (!jobPost) {
    return SendErrorResponse.notFound({
      res,
      ...buildErrorPayload(
        req.originalUrl,
        functionName,
        req.method,
        "Career post not found",
        DATA_NOT_FOUND,
        `No career post found with the ID: ${careerId}`
      )
    });
  }

  const formattedJobPost = {
    id: jobPost._id.toString(),
    jobTitle: jobPost.jobTitle,
    department: jobPost.department,
    employmentType: jobPost.employmentType,
    showSalary: jobPost.showSalary,
    salary: jobPost.showSalary
      ? {
          minimum: jobPost.minimumSalary,
          maximum: jobPost.maximumSalary,
          currency: jobPost.currency
        }
      : null,
    applicationDeadline: jobPost.applicationDeadline.toISOString().split("T")[0],
    postedAt: jobPost.postedAt?.toISOString().split("T")[0],
    jobDescription: jobPost.jobDescription,
    requirements: jobPost.requirements,
    benefits: jobPost.benefits,
    branches: jobPost.branchesInfo.map((b) => ({ id: b.branchId, name: b.branchName }))
  };

  return SendResponse.success({
    res,
    message: "Career post fetched successfully",
    data: {
      jobPost: formattedJobPost
    }
  });
}

export async function uploadJobDocumentHandler(req: Request, res: Response) {
  const functionName = uploadJobDocumentHandler.name;
  const { file } = req;
  if (!file) {
    return SendErrorResponse.badRequest({
      res,
      ...buildErrorPayload(
        req.originalUrl,
        functionName,
        req.method,
        "No file uploaded",
        INPUT_MISSING,
        "No file uploaded"
      )
    });
  }

  if (file.mimetype !== "application/pdf") {
    return SendErrorResponse.badRequest({
      res,
      ...buildErrorPayload(
        req.originalUrl,
        functionName,
        req.method,
        "Invalid file type. Only PDF files are allowed",
        INPUT_MISSING,
        "Invalid file type. Only PDF files are allowed"
      )
    });
  }

  const filepath = file.path;

  const fileUploadRes = await uploadFileR2WithAutoKey(filepath, "job-application-docs", false);

  if (!fileUploadRes.success) {
    if (fileUploadRes.code === 404) {
      return SendErrorResponse.notFound({
        res,
        ...buildErrorPayload(
          req.originalUrl,
          functionName,
          req.method,
          fileUploadRes.message || "File not found",
          DATA_NOT_FOUND,
          "File not found"
        )
      });
    }

    return SendErrorResponse.internalServer({
      res,
      ...buildErrorPayload(
        req.originalUrl,
        functionName,
        req.method,
        fileUploadRes.message || "File upload failed",
        UNEXPECTED_ERROR,
        "File upload failed"
      )
    });
  }

  return SendResponse.success({
    res,
    message: "Job document uploaded successfully",
    data: {
      url: fileUploadRes.publicUrl
    }
  });
}

export async function applyToCareerPostHandler(
  req: Request<{ careerId: string }, Record<string, never>, ApplyCareerPostType>,
  res: Response
) {
  const functionName = applyToCareerPostHandler.name;
  const { careerId } = req.params;
  const { applicantName, applicantEmail, applicantPhone, resumeUrl, coverLetter } = req.body;

  const jobPost = await findCareerPostById(careerId);
  if (!jobPost) {
    return SendErrorResponse.notFound({
      res,
      ...buildErrorPayload(
        req.originalUrl,
        functionName,
        req.method,
        "Career post not found",
        DATA_NOT_FOUND,
        `No career post found with the ID: ${careerId}`
      )
    });
  }

  const AUSTRALIA_TZ = "Australia/Sydney";
  const appliedTime = DateTime.now().setZone(AUSTRALIA_TZ);

  jobPost.applications.push({
    id: uuid(),
    applicantName,
    applicantEmail,
    applicantPhone: {
      ...applicantPhone,
      e164: `+${applicantPhone.countryCode}${applicantPhone.number}`
    },
    resumeUrl,
    coverLetter: coverLetter || "",
    appliedAt: appliedTime.toJSDate()
  });

  jobPost.markModified("applications");
  await jobPost.save();

  return SendResponse.success({
    res,
    message: "Applied to career post successfully",
    data: null
  });
}

export async function getWebsiteContactPageDataHandler(req: Request, res: Response) {
  // const functionName = getWebsiteContactPageDataHandler.name;

  const branches = await findAllBranches();
  const finalBranches = branches.map((branch) => {
    const openingHourStr = formatWeeklySchedule(branch.weeklySchedule);
    return {
      id: branch._id.toString(),
      name: branch.name,
      address: branch.address,
      phone: branch.phone,
      email: branch.email,
      openingHours: openingHourStr
    };
  });

  return SendResponse.success({
    res,
    message: "Website contact page public data fetched successfully",
    data: {
      branches: finalBranches
    }
  });
}

export async function getWebsiteBranchesPublicDataHandler(req: Request, res: Response) {
  const cacheKey = "website_branches_data";
  const cachedData = appCache.get(cacheKey);
  if (cachedData) {
    return SendResponse.success({
      res,
      message: "Website branches public data fetched successfully (cached)",
      data: cachedData
    });
  }

  const branches = await findAllBranches();
  const finalBranches = branches.map((branch) => {
    return {
      id: branch._id.toString(),
      name: branch.name,
      address: branch.address
    };
  });

  const responseData = {
    branches: finalBranches
  };

  appCache.set(cacheKey, responseData);

  return SendResponse.success({
    res,
    message: "Website branches public data fetched successfully",
    data: responseData
  });
}

export async function getWebsiteBranchServicesPublicDataHandler(req: Request, res: Response) {
  const functionName = getWebsiteBranchServicesPublicDataHandler.name;
  const { branchId } = req.params;

  const cacheKey = `website_branch_services_data_${branchId}`;
  const cachedData = appCache.get(cacheKey);
  if (cachedData) {
    return SendResponse.success({
      res,
      message: "Website pricing page data fetched successfully (cached)",
      data: cachedData
    });
  }

  const branch = isValidObjectId(branchId) ? await findBranchById(branchId) : null;
  if (!branch) {
    return SendErrorResponse.notFound({
      res,
      ...buildErrorPayload(
        req.originalUrl,
        functionName,
        req.method,
        "Branch not found",
        DATA_NOT_FOUND,
        `No branch found with the ID: ${branchId}`
      )
    });
  }

  const serviceCategories = await findAllServiceCategoriesOfBranch(branch._id.toString());
  const finalServicesCategories = await Promise.all(
    serviceCategories.map(async (category) => {
      const services = await findActiveServicesByCategoryIdAndBranch(category._id.toString(), branch._id.toString());

      return {
        categoryId: category._id.toString(),
        categoryName: category.name,
        services: services.map((service) => ({
          id: service._id.toString(),
          name: service.name,
          description: service.description,
          price: service.price,
          duration: service.duration
        }))
      };
    })
  );

  const comboServices = await findAllCombosOfBranch(branch._id.toString());
  const finalComboServices = comboServices.map((combo) => ({
    id: combo._id.toString(),
    name: combo.name,
    description: combo.description,
    price: combo.price,
    currency: combo.currency,
    features: combo.comboItems
  }));

  const responseData = {
    individualServices: {
      serviceCategories: finalServicesCategories
    },
    serviceCombos: finalComboServices || []
  };

  appCache.set(cacheKey, responseData);

  return SendResponse.success({
    res,
    message: "Website pricing page data fetched successfully",
    data: responseData
  });
}

export async function getBlogCategoriesAndTagsHandler(req: Request, res: Response) {
  // const functionName = getBlogCategoriesAndTagsHandler.name;

  const blogPosts = await BlogModel.find({ status: BlogStatus.PUBLISHED });
  const categorySet = new Set<string>();
  const tagSet = new Set<string>();

  blogPosts.forEach((post) => {
    categorySet.add(post.category);
    (post.tags || []).forEach((tag) => tagSet.add(tag));
  });

  const categories = Array.from(categorySet);
  const tags = Array.from(tagSet);

  return SendResponse.success({
    res,
    message: "Blog categories and tags fetched successfully",
    data: {
      blog: { categories, tags }
    }
  });
}

export async function getAllPublishedBlogsHandler(req: Request, res: Response) {
  // const functionName = getAllPublishedBlogsHandler.name;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;

  const blogs = await BlogModel.find({ status: BlogStatus.PUBLISHED })
    .sort({ publishedAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  const totalBlogs = await BlogModel.countDocuments({ status: BlogStatus.PUBLISHED });
  const totalPages = Math.ceil(totalBlogs / limit);

  const hasNext = page < totalPages;

  const formattedBlogs = blogs.map((blog) => {
    // calculate estimated reading time based on character count
    const wordsPerMinute = 200;
    const text = blog.content || "";
    const textLength = text.split(" ").length;
    const estimatedReadingTime = Math.ceil(textLength / wordsPerMinute);

    return {
      id: blog._id.toString(),
      title: blog.title,
      category: blog.category,
      publishedAt: blog.publishedAt,
      author: blog.author,
      tags: blog.tags,
      excerpt: blog.briefDescription,
      coverImage: blog.featuredImage,
      estimatedReadingTime
    };
  });

  return SendResponse.success({
    res,
    message: "Published blogs fetched successfully",
    data: {
      items: formattedBlogs,
      totalItems: totalBlogs,
      totalPages,
      currentPage: page,
      limit,
      hasNext
    }
  });
}

export async function getSinglePublishedBlogHandler(req: Request, res: Response) {
  const functionName = getSinglePublishedBlogHandler.name;
  const { blogId } = req.params;

  const blog = await BlogModel.findById(blogId);
  if (!blog || blog.status !== BlogStatus.PUBLISHED) {
    return SendErrorResponse.notFound({
      res,
      ...buildErrorPayload(
        req.originalUrl,
        functionName,
        req.method,
        `No published blog post found with the ID: ${blogId}`,
        DATA_NOT_FOUND,
        "The requested blog post does not exist or is not published."
      )
    });
  }

  const wordsPerMinute = 200;
  const text = blog.content || "";
  const textLength = text.split(" ").length;
  const estimatedReadingTime = Math.ceil(textLength / wordsPerMinute);

  const relatedBlogs = await BlogModel.find({
    _id: { $ne: blog._id },
    category: blog.category,
    status: BlogStatus.PUBLISHED
  })
    .sort({ publishedAt: -1 })
    .limit(4);

  return SendResponse.success({
    res,
    message: "Published blog fetched successfully",
    data: {
      blog: {
        id: blog._id.toString(),
        title: blog.title,
        category: blog.category,
        publishedAt: blog.publishedAt,
        author: blog.author,
        tags: blog.tags,
        excerpt: blog.briefDescription,
        coverImage: blog.featuredImage,
        estimatedReadingTime,
        content: blog.content
      },
      relatedBlogs: relatedBlogs.map((relatedBlog) => {
        const wordsPerMinute = 200;
        const text = relatedBlog.content || "";
        const textLength = text.split(" ").length;
        const readingTime = Math.ceil(textLength / wordsPerMinute);
        return {
          id: relatedBlog._id.toString(),
          title: relatedBlog.title,
          category: relatedBlog.category,
          publishedAt: relatedBlog.publishedAt,
          author: relatedBlog.author,
          tags: relatedBlog.tags,
          excerpt: relatedBlog.briefDescription,
          coverImage: relatedBlog.featuredImage,
          estimatedReadingTime: readingTime
        };
      })
    }
  });
}

export async function submitReviewPublicHandler(
  req: Request<Record<string, never>, Response, SubmitReviewInput>,
  res: Response
) {
  const functionName = submitReviewPublicHandler.name;
  const { customerName, customerEmail, customerImage, rating, comment } = req.body;

  const newReview = await ReviewModel.create({
    customerName,
    customerEmail,
    customerImage,
    rating,
    comment,
    showInWebsite: false
  });
  if (!newReview) {
    return SendErrorResponse.internalServer({
      res,
      ...buildErrorPayload(
        req.originalUrl,
        functionName,
        req.method,
        "Failed to submit review",
        UNEXPECTED_ERROR,
        "An error occurred while submitting your review. Please try again later."
      )
    });
  }

  return SendResponse.success({
    res,
    message: "Review submitted successfully",
    data: null
  });
}
