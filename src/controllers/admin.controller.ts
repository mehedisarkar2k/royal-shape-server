import { Request, Response } from "express";
import { v4 as uuid } from "uuid";
import { DateTime } from "luxon";
import {
  AddWebsiteShowcaseType,
  PostGeneralSettingsDataType,
  PostSocialMediaLinksDataType,
  PostWebsiteAboutDataType,
  PostWebsiteHomeDataType,
  PostWebsiteServiceDataType
} from "../schemas";
import { calculateTimeDurationInMinutes, SendErrorResponse, SendResponse } from "../utils";
import {
  BusinessInfo,
  BusinessInfoModel,
  WebsiteServiceInfo,
  BookingModel,
  CustomerModel,
  ServiceModel,
  AdminSettingsModel
} from "../model";
import { ApplicationServices, DATA_NOT_FOUND, UNAUTHORIZED_ERROR, BookingStatus } from "../constants";
import { findServiceCategoryById } from "../services";
import { Types } from "mongoose";

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
    service: ApplicationServices.ADMIN,
    id: uuid()
  }
});

// * make a function to create a mongodb document into business info collection if not exists, there will be only one document in this collection. All the data will be stored in this document. This function will be called when the server starts or we can run through an endpoint.
export async function createBusinessInfoDocumentIfNotExists(req: Request, res: Response) {
  const secret = req.headers["x-admin-secret"];
  if (secret !== process.env.ADMIN_SECRET) {
    return SendErrorResponse.unauthorized({
      res,
      ...buildErrorPayload(
        req.originalUrl,
        createBusinessInfoDocumentIfNotExists.name,
        req.method,
        "Unauthorized",
        UNAUTHORIZED_ERROR,
        "Invalid admin secret"
      )
    });
  }
  const existingDoc = await BusinessInfoModel.findOne().lean();
  if (!existingDoc) {
    // make sure to insert all the values both optional and required
    const newDoc: BusinessInfo = {
      name: "Royal Threading & Beauty",
      ownerName: "Marjan Mortuja",
      description: "Best beauty parlor in Australia",
      address: "123, Some Street, Some City, Australia",
      phone: { countryCode: "+61", number: "123456789", e164: "+61123456789" },
      email: "info@royalthreading.com",
      logo: "",
      socialInfo: {
        facebook: "https://facebook.com/royalthreading",
        instagram: "https://instagram.com/royalthreading",
        twitter: "https://twitter.com/royalthreading",
        linkedin: "https://linkedin.com/company/royalthreading",
        tiktok: "https://tiktok.com/@royalthreading",
        youtube: "https://youtube.com/royalthreading"
      },
      websiteInfo: {
        home: {
          heroSection: {
            title: "Welcome to Royal Threading & Beauty",
            subtitle: "Your beauty is our duty",
            image: "",
            ctaButton1: {
              text: "Book Now",
              link: "https://example.com/book"
            },
            ctaButton2: { text: "Learn More", link: "https://example.com/about" }
          }
        },
        services: [
          {
            id: uuid(),
            serviceId: "68b1f7cc51c212b8bb05d579",
            serviceName: "Threading",
            heroSection: {
              title: "Threading",
              subtitle: "Precision and care for your beauty",
              image: "",
              ctaButton1: { text: "Book Now", link: "https://example.com/book/threading" },
              ctaButton2: { text: "Learn More", link: "https://example.com/services/threading" }
            },
            bodySections: [
              // 3 body sections
              {
                id: uuid(),
                title: "Eyebrow Threading",
                content: "Get perfectly shaped eyebrows with our expert threading services.",
                image: ""
              },
              {
                id: uuid(),
                title: "Facial Threading",
                content: "Experience smooth and hair-free skin with our facial threading treatments.",
                image: ""
              },
              {
                id: uuid(),
                title: "Full Body Threading",
                content: "Comprehensive threading services for a polished look from head to toe.",
                image: ""
              }
            ]
          }
        ],
        about: {
          bodySections: [
            // 2 body sections
            {
              id: uuid(),
              title: "Our Story",
              content:
                "Founded in 2010, Royal Threading & Beauty has been dedicated to providing top-notch beauty services to our community. Our journey began with a passion for enhancing natural beauty and has grown into a trusted name in the industry.",
              image: ""
            },
            {
              id: uuid(),
              title: "Our Mission",
              content:
                "At Royal Threading & Beauty, our mission is to empower individuals by enhancing their natural beauty through expert care and personalized services. We strive to create a welcoming environment where every client feels valued and beautiful.",
              image: ""
            }
          ]
        }
      }
    };
    const newBusinessInfo = await BusinessInfoModel.create(newDoc);

    return SendResponse.success({
      res,
      message: "Business info document created successfully",
      data: {
        id: newBusinessInfo._id
      }
    });
  }

  return SendResponse.success({
    res,
    message: "Business info document already exists",
    data: {
      id: existingDoc._id
    }
  });
}

export async function getWebsiteHomeDataHandler(req: Request, res: Response) {
  const functionName = getWebsiteHomeDataHandler.name;

  const businessInfo = await BusinessInfoModel.findOne().lean();
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

  const websiteHomeInfo = businessInfo.websiteInfo?.home;

  if (!websiteHomeInfo) {
    return SendErrorResponse.notFound({
      res,
      ...buildErrorPayload(
        req.originalUrl,
        functionName,
        req.method,
        "Website home info not found",
        DATA_NOT_FOUND,
        "Website home info not found"
      )
    });
  }

  return SendResponse.success({
    res,
    message: "Website home data fetched successfully",
    data: {
      heroSection: {
        chipText: websiteHomeInfo.heroSection.chipText || "",
        title: websiteHomeInfo.heroSection.title,
        subtitle: websiteHomeInfo.heroSection.subtitle,
        ctaButton1: {
          text: websiteHomeInfo.heroSection.ctaButton1.text,
          link: websiteHomeInfo.heroSection.ctaButton1.link
        },
        ctaButton2: {
          text: websiteHomeInfo.heroSection.ctaButton2.text,
          link: websiteHomeInfo.heroSection.ctaButton2.link
        },
        image: websiteHomeInfo.heroSection.image
      }
    }
  });
}

export async function postWebsiteHomeDataHandler(
  req: Request<Record<string, never>, Record<string, never>, PostWebsiteHomeDataType>,
  res: Response
) {
  const functionName = postWebsiteHomeDataHandler.name;
  const data = req.body;

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

  const websiteHomeInfo = businessInfo.websiteInfo?.home;
  if (!websiteHomeInfo) {
    return SendErrorResponse.notFound({
      res,
      ...buildErrorPayload(
        req.originalUrl,
        functionName,
        req.method,
        "Website home info not found",
        DATA_NOT_FOUND,
        "Website home info not found"
      )
    });
  }

  // * update home info
  businessInfo.websiteInfo.home = {
    heroSection: {
      chipText: data.heroSection.chipText || websiteHomeInfo.heroSection.chipText || "",
      title: data.heroSection.title || websiteHomeInfo.heroSection.title,
      subtitle: data.heroSection.subtitle || websiteHomeInfo.heroSection.subtitle,
      ctaButton1: {
        text: data.heroSection.ctaButton1.text || websiteHomeInfo.heroSection.ctaButton1.text,
        link: data.heroSection.ctaButton1.link || websiteHomeInfo.heroSection.ctaButton1.link
      },
      ctaButton2: {
        text: data.heroSection.ctaButton2.text || websiteHomeInfo.heroSection.ctaButton2.text,
        link: data.heroSection.ctaButton2.link || websiteHomeInfo.heroSection.ctaButton2.link
      },
      image: data.heroSection.image || websiteHomeInfo.heroSection.image
    }
  };

  businessInfo.markModified("websiteInfo.home");

  await businessInfo.save();

  return SendResponse.success({
    res,
    message: "Website home data posted successfully",
    data: null
  });
}

export async function getWebsiteServiceDataHandler(req: Request, res: Response) {
  const functionName = getWebsiteHomeDataHandler.name;
  const { serviceCategoryId } = req.params;

  const serviceCategory = await findServiceCategoryById(serviceCategoryId);
  if (!serviceCategory) {
    return SendErrorResponse.notFound({
      res,
      ...buildErrorPayload(
        req.originalUrl,
        functionName,
        req.method,
        "Service category not found",
        DATA_NOT_FOUND,
        "Service category not found"
      )
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

  const websiteServiceInfo = businessInfo.websiteInfo?.services;

  if (!websiteServiceInfo) {
    return SendErrorResponse.notFound({
      res,
      ...buildErrorPayload(
        req.originalUrl,
        functionName,
        req.method,
        "Website service info not found",
        DATA_NOT_FOUND,
        "Website service info not found"
      )
    });
  }

  const serviceInfo = websiteServiceInfo.find((service) => service.serviceId === serviceCategoryId);
  if (!serviceInfo) {
    return SendResponse.success({
      res,
      message: "Website service data fetched successfully",
      data: {
        serviceInfo: null
      }
    });
  }

  return SendResponse.success({
    res,
    message: "Website service data fetched successfully",
    data: {
      serviceInfo: {
        id: serviceInfo.id,
        serviceId: serviceInfo.serviceId,
        serviceName: serviceInfo.serviceName,
        heroSection: {
          title: serviceInfo.heroSection.title,
          subtitle: serviceInfo.heroSection.subtitle,
          image: serviceInfo.heroSection.image,
          ctaButton1: {
            text: serviceInfo.heroSection.ctaButton1.text,
            link: serviceInfo.heroSection.ctaButton1.link
          },
          ctaButton2: {
            text: serviceInfo.heroSection.ctaButton2.text,
            link: serviceInfo.heroSection.ctaButton2.link
          }
        },
        bodySections: serviceInfo.bodySections.map((section) => ({
          id: section.id,
          title: section.title,
          content: section.content,
          image: section.image
        }))
      }
    }
  });
}

export async function postWebsiteServiceDataHandler(
  req: Request<Record<string, never>, Record<string, never>, PostWebsiteServiceDataType>,
  res: Response
) {
  const functionName = postWebsiteHomeDataHandler.name;
  const data = req.body;
  const { serviceCategoryId } = req.params;

  const serviceCategory = await findServiceCategoryById(serviceCategoryId);
  if (!serviceCategory) {
    return SendErrorResponse.notFound({
      res,
      ...buildErrorPayload(
        req.originalUrl,
        functionName,
        req.method,
        "Service category not found",
        DATA_NOT_FOUND,
        "Service category not found"
      )
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

  const websiteServiceInfo = businessInfo.websiteInfo?.services;
  if (!websiteServiceInfo) {
    return SendErrorResponse.notFound({
      res,
      ...buildErrorPayload(
        req.originalUrl,
        functionName,
        req.method,
        "Website service info not found",
        DATA_NOT_FOUND,
        "Website service info not found"
      )
    });
  }

  let serviceInfo: WebsiteServiceInfo | undefined = websiteServiceInfo.find(
    (service) => service.serviceId === serviceCategoryId
  );

  if (!serviceInfo) {
    // * create new service info
    serviceInfo = {
      id: uuid(),
      serviceId: serviceCategoryId,
      serviceName: serviceCategory.name,
      heroSection: {
        title: data.heroSection.title,
        subtitle: data.heroSection.subtitle,
        image: data.heroSection.image,
        ctaButton1: {
          text: data.heroSection.ctaButton1.text,
          link: data.heroSection.ctaButton1.link
        },
        ctaButton2: {
          text: data.heroSection.ctaButton2.text,
          link: data.heroSection.ctaButton2.link
        }
      },
      bodySections: data.bodySections.map((section) => ({
        id: uuid(),
        title: section.title,
        content: section.content,
        image: section.image || null
      }))
    };
    businessInfo.websiteInfo.services.push(serviceInfo);
    await businessInfo.save();
    return SendResponse.success({
      res,
      message: "Website service data posted successfully",
      data: null
    });
  }

  // * update service info
  serviceInfo.heroSection = {
    title: data.heroSection.title || serviceInfo.heroSection.title,
    subtitle: data.heroSection.subtitle || serviceInfo.heroSection.subtitle,
    image: data.heroSection.image || serviceInfo.heroSection.image,
    ctaButton1: {
      text: data.heroSection.ctaButton1.text || serviceInfo.heroSection.ctaButton1.text,
      link: data.heroSection.ctaButton1.link || serviceInfo.heroSection.ctaButton1.link
    },
    ctaButton2: {
      text: data.heroSection.ctaButton2.text || serviceInfo.heroSection.ctaButton2.text,
      link: data.heroSection.ctaButton2.link || serviceInfo.heroSection.ctaButton2.link
    }
  };

  // * update body sections - there may new sections so we have to map through the new sections and check if the section with the same index exists, if exists then update it otherwise create a new one
  const updatedBodySections = [];

  // Update existing sections
  for (let i = 0; i < Math.min(serviceInfo.bodySections.length, data.bodySections.length); i += 1) {
    updatedBodySections.push({
      id: serviceInfo.bodySections[i].id,
      title: data.bodySections[i].title || serviceInfo.bodySections[i].title,
      content: data.bodySections[i].content || serviceInfo.bodySections[i].content,
      image: data.bodySections[i].image || serviceInfo.bodySections[i].image
    });
  }

  // Add new sections
  if (data.bodySections.length > serviceInfo.bodySections.length) {
    for (let i = serviceInfo.bodySections.length; i < data.bodySections.length; i += 1) {
      updatedBodySections.push({
        id: uuid(),
        title: data.bodySections[i].title,
        content: data.bodySections[i].content,
        image: data.bodySections[i].image || null
      });
    }
  }

  serviceInfo.bodySections = updatedBodySections;

  businessInfo.markModified("websiteInfo.services");

  await businessInfo.save();

  return SendResponse.success({
    res,
    message: "Website service data posted successfully",
    data: null
  });
}

export async function getWebsiteAboutDataHandler(req: Request, res: Response) {
  const functionName = getWebsiteHomeDataHandler.name;

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

  const websiteAboutInfo = businessInfo.websiteInfo?.about;
  if (!websiteAboutInfo) {
    return SendErrorResponse.notFound({
      res,
      ...buildErrorPayload(
        req.originalUrl,
        functionName,
        req.method,
        "Website about info not found",
        DATA_NOT_FOUND,
        "Website about info not found"
      )
    });
  }

  return SendResponse.success({
    res,
    message: "Website about data fetched successfully",
    data: {
      aboutInfo: {
        bodySections: websiteAboutInfo.bodySections.map((section) => ({
          id: section.id,
          title: section.title,
          content: section.content,
          image: section.image
        }))
      }
    }
  });
}

export async function postWebsiteAboutDataHandler(
  req: Request<Record<string, never>, Record<string, never>, PostWebsiteAboutDataType>,
  res: Response
) {
  const functionName = postWebsiteAboutDataHandler.name;
  const data = req.body;

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

  const websiteAboutInfo = businessInfo.websiteInfo?.about;
  if (!websiteAboutInfo) {
    return SendErrorResponse.notFound({
      res,
      ...buildErrorPayload(
        req.originalUrl,
        functionName,
        req.method,
        "Website about info not found",
        DATA_NOT_FOUND,
        "Website about info not found"
      )
    });
  }

  // * update about info
  const updatedBodySections = [];

  // Update existing sections
  for (let i = 0; i < Math.min(websiteAboutInfo.bodySections.length, data.bodySections.length); i += 1) {
    updatedBodySections.push({
      id: websiteAboutInfo.bodySections[i].id,
      title: data.bodySections[i].title || websiteAboutInfo.bodySections[i].title,
      content: data.bodySections[i].content || websiteAboutInfo.bodySections[i].content,
      image: data.bodySections[i].image || websiteAboutInfo.bodySections[i].image
    });
  }

  // Add new sections
  if (data.bodySections.length > websiteAboutInfo.bodySections.length) {
    for (let i = websiteAboutInfo.bodySections.length; i < data.bodySections.length; i += 1) {
      updatedBodySections.push({
        id: uuid(),
        title: data.bodySections[i].title,
        content: data.bodySections[i].content,
        image: data.bodySections[i].image || null
      });
    }
  }

  websiteAboutInfo.bodySections = updatedBodySections;

  businessInfo.markModified("websiteInfo.about");

  await businessInfo.save();

  return SendResponse.success({
    res,
    message: "Website about data posted successfully",
    data: null
  });
}

export async function getGeneralSettingsDataHandler(req: Request, res: Response) {
  const functionName = getGeneralSettingsDataHandler.name;

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

  const generalSettingsData = {
    businessName: businessInfo.name,
    ownerName: businessInfo.ownerName,
    businessAddress: businessInfo.address,
    phoneNumber: businessInfo.phone,
    email: businessInfo.email,
    logo: businessInfo.logo
  };

  return SendResponse.success({
    res,
    message: "General settings data fetched successfully",
    data: {
      generalSettings: generalSettingsData
    }
  });
}

export async function postGeneralSettingsDataHandler(
  req: Request<Record<string, never>, Record<string, never>, PostGeneralSettingsDataType>,
  res: Response
) {
  const functionName = postGeneralSettingsDataHandler.name;
  const data = req.body;

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

  businessInfo.name = data.businessName || businessInfo.name;
  businessInfo.ownerName = data.ownerName || businessInfo.ownerName;
  businessInfo.address = data.businessAddress || businessInfo.address;
  businessInfo.phone = data.phoneNumber
    ? {
        countryCode: data.phoneNumber.countryCode,
        number: data.phoneNumber.number,
        e164: `${data.phoneNumber.countryCode}${data.phoneNumber.number}`
      }
    : businessInfo.phone;
  businessInfo.email = data.email || businessInfo.email;
  businessInfo.logo = data.logo || businessInfo.logo;

  await businessInfo.save();

  return SendResponse.success({
    res,
    message: "General settings data posted successfully",
    data: null
  });
}

export async function getSocialLinksDataHandler(req: Request, res: Response) {
  const functionName = getSocialLinksDataHandler.name;

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

  const socialLinks = businessInfo.socialInfo;

  return SendResponse.success({
    res,
    message: "Social links data fetched successfully",
    data: {
      socialLinks: {
        facebook: socialLinks.facebook || "",
        instagram: socialLinks.instagram || "",
        twitter: socialLinks.twitter || "",
        linkedin: socialLinks.linkedin || "",
        tiktok: socialLinks.tiktok || "",
        youtube: socialLinks.youtube || ""
      }
    }
  });
}

export async function postSocialLinksDataHandler(
  req: Request<Record<string, never>, Record<string, never>, PostSocialMediaLinksDataType>,
  res: Response
) {
  const functionName = postSocialLinksDataHandler.name;
  const data = req.body;

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

  businessInfo.socialInfo.facebook = data.facebook || businessInfo.socialInfo.facebook;
  businessInfo.socialInfo.instagram = data.instagram || businessInfo.socialInfo.instagram;
  businessInfo.socialInfo.twitter = data.twitter || businessInfo.socialInfo.twitter;
  businessInfo.socialInfo.linkedin = data.linkedin || businessInfo.socialInfo.linkedin;
  businessInfo.socialInfo.tiktok = data.tiktok || businessInfo.socialInfo.tiktok;
  businessInfo.socialInfo.youtube = data.youtube || businessInfo.socialInfo.youtube;

  await businessInfo.save();

  return SendResponse.success({
    res,
    message: "Social links data posted successfully",
    data: null
  });
}

export async function getDashboardOverviewDataHandler(req: Request, res: Response) {
  const functionName = getDashboardOverviewDataHandler.name;

  try {
    // Get current date ranges in Australian timezone (Sydney/Melbourne)
    const AUSTRALIA_TZ = "Australia/Sydney";
    const now = DateTime.now().setZone(AUSTRALIA_TZ);

    // For MongoDB queries: We need to create Date objects that represent
    // the start/end of day in Australian timezone
    // Method: Create dates in UTC that match the Australian local date
    const todayDateStr = now.toFormat("yyyy-MM-dd");
    const todayStart = new Date(`${todayDateStr}T00:00:00.000Z`);
    const todayEnd = new Date(`${todayDateStr}T23:59:59.999Z`);

    const yesterdayDateStr = now.minus({ days: 1 }).toFormat("yyyy-MM-dd");
    const yesterdayStart = new Date(`${yesterdayDateStr}T00:00:00.000Z`);
    const yesterdayEnd = new Date(`${yesterdayDateStr}T23:59:59.999Z`);

    const lastMonthDateStr = now.minus({ months: 1 }).toFormat("yyyy-MM-dd");
    const lastMonthEnd = new Date(`${lastMonthDateStr}T23:59:59.999Z`);

    // * TOP SECTION DATA

    // Today's confirmed bookings count
    const todaysBookingsCount = await BookingModel.countDocuments({
      bookingDate: { $gte: todayStart, $lte: todayEnd },
      status: { $in: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED] }
    });

    // Yesterday's confirmed bookings count
    const yesterdaysBookingsCount = await BookingModel.countDocuments({
      bookingDate: { $gte: yesterdayStart, $lte: yesterdayEnd },
      status: { $in: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED] }
    });

    // Calculate percentage change for bookings
    const bookingsPercentageChange =
      yesterdaysBookingsCount === 0
        ? todaysBookingsCount > 0
          ? 100
          : 0
        : Math.round(((todaysBookingsCount - yesterdaysBookingsCount) / yesterdaysBookingsCount) * 100);

    // Today's income from confirmed bookings
    const todaysIncomeResult = await BookingModel.aggregate([
      {
        $match: {
          bookingDate: { $gte: todayStart, $lte: todayEnd },
          status: { $in: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED] }
        }
      },
      {
        $group: {
          _id: null,
          totalIncome: { $sum: "$totalPrice" }
        }
      }
    ]);
    const todaysIncome = todaysIncomeResult.length > 0 ? todaysIncomeResult[0].totalIncome : 0;

    // Yesterday's income from confirmed bookings
    const yesterdaysIncomeResult = await BookingModel.aggregate([
      {
        $match: {
          bookingDate: { $gte: yesterdayStart, $lte: yesterdayEnd },
          status: { $in: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED] }
        }
      },
      {
        $group: {
          _id: null,
          totalIncome: { $sum: "$totalPrice" }
        }
      }
    ]);
    const yesterdaysIncome = yesterdaysIncomeResult.length > 0 ? yesterdaysIncomeResult[0].totalIncome : 0;

    // Calculate percentage change for income
    const incomePercentageChange =
      yesterdaysIncome === 0
        ? todaysIncome > 0
          ? 100
          : 0
        : Math.round(((todaysIncome - yesterdaysIncome) / yesterdaysIncome) * 100);

    // Total customers count
    const totalCustomersCount = await CustomerModel.countDocuments();

    // Last month's customers count
    const lastMonthCustomersCount = await CustomerModel.countDocuments({
      createdAt: { $lte: lastMonthEnd }
    });

    // Calculate percentage change for customers
    const customersPercentageChange =
      lastMonthCustomersCount === 0
        ? totalCustomersCount > 0
          ? 100
          : 0
        : Math.round(((totalCustomersCount - lastMonthCustomersCount) / lastMonthCustomersCount) * 100);

    // Upcoming events in 2 hours (confirmed bookings with start time within next 2 hours)
    const twoHoursLaterTime = now.plus({ hours: 2 }).toFormat("HH:mm");
    const upcomingEventsCount = await BookingModel.countDocuments({
      bookingDate: { $gte: todayStart, $lte: todayEnd },
      status: BookingStatus.CONFIRMED,
      startTime: { $lte: twoHoursLaterTime }
    });

    // * BOTTOM LEFT SECTION DATA - Recent 5 bookings today

    const todaysRecentBookings = await BookingModel.aggregate([
      {
        $match: {
          bookingDate: { $gte: todayStart, $lte: todayEnd },
          status: { $in: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED] }
        }
      },
      {
        $sort: { startTime: 1 }
      },
      {
        $limit: 5
      },
      {
        $addFields: {
          customerObjId: { $toObjectId: "$customerId" }
        }
      },
      {
        $lookup: {
          from: "customers",
          localField: "customerObjId",
          foreignField: "_id",
          as: "customerInfo"
        }
      },
      {
        $unwind: {
          path: "$customerInfo",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          customerId: 1,
          customerName: {
            $concat: [
              { $ifNull: ["$customerInfo.firstName", "Unknown"] },
              " ",
              { $ifNull: ["$customerInfo.lastName", ""] }
            ]
          },
          serviceType: 1,
          serviceIds: 1,
          comboId: 1,
          startTime: 1,
          endTime: 1,
          status: 1,
          branchId: 1,
          branchName: 1
        }
      }
    ]);

    // Calculate duration and get service names
    const formattedTodaysBookings = await Promise.all(
      todaysRecentBookings.map(async (booking) => {
        let serviceName = "N/A";

        // Get service name based on service type
        if (booking.serviceIds && booking.serviceIds.length > 0) {
          const serviceObjIds = booking.serviceIds.map((id: string) => new Types.ObjectId(id));
          const services = await ServiceModel.find({ _id: { $in: serviceObjIds } }).select("name duration");
          serviceName = services.map((s) => s.name).join(", ");
        }

        const duration = calculateTimeDurationInMinutes(booking.startTime, booking.endTime);

        return {
          customerId: booking.customerId,
          customerName: booking.customerName.trim() || "Unknown",
          serviceName,
          startTime: booking.startTime,
          duration,
          status: booking.status,
          branch: {
            id: booking.branchId,
            name: booking.branchName
          }
        };
      })
    );

    // * BOTTOM RIGHT SECTION DATA - Top 5 services by bookings

    const topServicesData = await BookingModel.aggregate([
      {
        $match: {
          status: { $in: ["confirmed", "completed"] },
          serviceIds: {
            $exists: true,
            $ne: null,
            $not: { $size: 0 }
          }
        }
      },
      {
        $unwind: "$serviceIds"
      },
      {
        $group: {
          _id: "$serviceIds",
          numberOfBookings: { $sum: 1 },
          totalIncome: { $sum: "$totalPrice" }
        }
      },
      {
        $sort: { numberOfBookings: -1 }
      },
      {
        $limit: 5
      },
      {
        $addFields: {
          objId: { $toObjectId: "$_id" }
        }
      },
      {
        $lookup: {
          from: "services",
          localField: "objId",
          foreignField: "_id",
          as: "serviceInfo"
        }
      },
      {
        $unwind: {
          path: "$serviceInfo",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          serviceName: {
            $ifNull: ["$serviceInfo.name", "Unknown Service"]
          },
          numberOfBookings: 1,
          totalIncome: 1
        }
      }
    ]);

    // Format response
    return SendResponse.success({
      res,
      message: "Dashboard overview data fetched successfully",
      data: {
        topSection: {
          todaysBookings: {
            count: todaysBookingsCount,
            percentageChange: bookingsPercentageChange
          },
          todaysIncome: {
            amount: Math.round(todaysIncome * 100) / 100,
            percentageChange: incomePercentageChange
          },
          totalCustomers: {
            count: totalCustomersCount,
            percentageChange: customersPercentageChange
          },
          upcomingEventsIn2Hours: {
            count: upcomingEventsCount
          }
        },
        bottomLeftSection: {
          todaysBookings: formattedTodaysBookings
        },
        bottomRightSection: {
          topServices: topServicesData.map((service) => ({
            serviceName: service.serviceName,
            numberOfBookings: service.numberOfBookings,
            totalIncome: Math.round(service.totalIncome * 100) / 100
          }))
        }
      }
    });
  } catch (error) {
    return SendErrorResponse.internalServer({
      res,
      ...buildErrorPayload(
        req.originalUrl,
        functionName,
        req.method,
        "Failed to fetch dashboard overview data",
        { code: "INTERNAL_SERVER_ERROR", message: "An error occurred while fetching dashboard data" },
        error instanceof Error ? (error as Error).message : "Unknown error"
      )
    });
  }
}

export async function getAllWebsiteShowcaseHandler(req: Request, res: Response) {
  const functionName = getAllWebsiteShowcaseHandler.name;

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
        "Website info not found"
      )
    });
  }

  const showcaseData = websiteInfo.showcase || [];

  return SendResponse.success({
    res,
    message: "Website showcase data fetched successfully",
    data: {
      showcases: showcaseData.map((showcase) => ({
        id: showcase.id,
        altText: showcase.altText,
        image: showcase.url
      }))
    }
  });
}

export async function addWebsiteShowcaseHandler(
  req: Request<Record<string, never>, Record<string, never>, AddWebsiteShowcaseType>,
  res: Response
) {
  const functionName = addWebsiteShowcaseHandler.name;
  const data = req.body;

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
        "Website info not found"
      )
    });
  }

  websiteInfo.showcase =
    websiteInfo.showcase && websiteInfo.showcase.length > 0
      ? [
          ...websiteInfo.showcase,
          {
            id: uuid(),
            altText: data.altText,
            url: data.image
          }
        ]
      : [
          {
            id: uuid(),
            altText: data.altText,
            url: data.image
          }
        ];

  businessInfo.markModified("websiteInfo.showcase");

  await businessInfo.save();

  return SendResponse.success({
    res,
    message: "Website showcase added successfully",
    data: null
  });
}

export async function deleteWebsiteShowcaseHandler(req: Request, res: Response) {
  const functionName = deleteWebsiteShowcaseHandler.name;
  const { showcaseId } = req.params;

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
        "Website info not found"
      )
    });
  }

  if (!websiteInfo.showcase || websiteInfo.showcase.length === 0) {
    return SendErrorResponse.notFound({
      res,
      ...buildErrorPayload(
        req.originalUrl,
        functionName,
        req.method,
        "Showcase not found",
        DATA_NOT_FOUND,
        "No showcase items to delete"
      )
    });
  }

  const initialLength = websiteInfo.showcase.length;
  websiteInfo.showcase = websiteInfo.showcase.filter((showcase) => showcase.id !== showcaseId);

  if (websiteInfo.showcase.length === initialLength) {
    return SendErrorResponse.notFound({
      res,
      ...buildErrorPayload(
        req.originalUrl,
        functionName,
        req.method,
        "Showcase not found",
        DATA_NOT_FOUND,
        `No showcase item found with id: ${showcaseId}`
      )
    });
  }

  businessInfo.markModified("websiteInfo.showcase");

  await businessInfo.save();

  return SendResponse.success({
    res,
    message: "Website showcase deleted successfully",
    data: null
  });
}

export async function getAdminSettingsHandler(req: Request, res: Response) {
  try {
    let settings = await AdminSettingsModel.findOne();
    if (!settings) {
      settings = await AdminSettingsModel.create({});
    }
    return SendResponse.success({ res, message: "Settings retrieved successfully", data: settings });
  } catch (error: unknown) {
    return SendErrorResponse.internalServer({
      res,
      ...buildErrorPayload(
        "/api/admin/settings",
        "getAdminSettingsHandler",
        "GET",
        (error as Error).message,
        { code: "INTERNAL_SERVER_ERROR", message: "Failed to retrieve admin settings" },
        "Internal server error"
      )
    });
  }
}

export async function postAdminSettingsHandler(req: Request, res: Response) {
  try {
    const { reminders } = req.body;
    let settings = await AdminSettingsModel.findOne();
    if (!settings) {
      settings = await AdminSettingsModel.create({ reminders });
    } else {
      settings.reminders = { ...settings.reminders, ...reminders };
      await settings.save();
    }
    return SendResponse.success({ res, message: "Settings updated successfully", data: settings });
  } catch (error: unknown) {
    return SendErrorResponse.internalServer({
      res,
      ...buildErrorPayload(
        "/api/admin/settings",
        "postAdminSettingsHandler",
        "POST",
        (error as Error).message,
        { code: "INTERNAL_SERVER_ERROR", message: "Failed to update admin settings" },
        "Internal server error"
      )
    });
  }
}
