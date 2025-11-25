/* eslint-disable */

import fs from "fs";
import path from "path";
import axios from "axios";
import { format } from "date-fns";
import config from "config";

import { logger } from "./logger";

const loadTemplate = (templateName: string, data: unknown): string => {
  const templatePath = path.join(__dirname, "..", "templates", `${templateName}.html`);
  const template = fs.readFileSync(templatePath, "utf8");
  let output = template;

  const entries = Object.entries(data as { [key: string]: unknown });
  entries.forEach(([key, value]) => {
    output = output.replace(new RegExp(`{{${key}}}`, "g"), value as string);
  });

  return output;
};

// Brevo API configuration
const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";
const BREVO_API_KEY = process.env.BREVO_API_KEY || (config.get("brevo.apiKey") as string);
const SENDER_EMAIL = process.env.SENDER_EMAIL || (config.get("brevo.senderEmail") as string);
const SENDER_NAME = process.env.SENDER_NAME || (config.get("brevo.senderName") as string) || "Royal Shape";

// Verify Brevo configuration on startup
if (!BREVO_API_KEY) {
  console.error("⚠️  BREVO_API_KEY is not configured!");
} else {
  console.log("✅ Brevo API Ready");
}

export const sendEmail = async (to: string, subject: string, html: string) => {
  try {
    const response = await axios.post(
      BREVO_API_URL,
      {
        sender: {
          email: SENDER_EMAIL,
          name: SENDER_NAME
        },
        to: [
          {
            email: to
          }
        ],
        subject: subject,
        htmlContent: html
      },
      {
        headers: {
          "api-key": BREVO_API_KEY,
          "Content-Type": "application/json",
          accept: "application/json"
        },
        timeout: 10000 // 10 second timeout
      }
    );

    logger.info(`✅ Email sent successfully to ${to} | Message ID: ${response.data.messageId}`);
    return { success: true, messageId: response.data.messageId };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const errorMessage = error.response?.data?.message || error.message;
      const errorCode = error.response?.data?.code || error.code;
      logger.error(`❌ Failed to send email to ${to} | Error: ${errorMessage} | Code: ${errorCode}`);

      // Log detailed error for debugging
      if (error.response) {
        logger.error(`Response status: ${error.response.status}`);
        logger.error(`Response data: ${JSON.stringify(error.response.data)}`);
      }
    } else {
      logger.error(`❌ Unexpected error sending email to ${to}: ${(error as Error).message}`);
    }

    throw error; // Re-throw to allow caller to handle
  }
};

export const sendContactUsEmail = async ({
  name,
  email,
  topic,
  message
}: {
  name: string;
  email: string;
  topic: string;
  message: string;
}) => {
  const subject = `${name} submitted a request from contact section.`;
  const copyRightYear = format(new Date(), "yyyy");
  const html = loadTemplate("contact-us.template", {
    name,
    email,
    topic,
    message,
    copyRightYear
  });

  await sendEmail(process.env.ADMIN_EMAIL || (config.get("server.adminEmail") as string), subject, html);
};

export const sendBookingRequestEmail = async (data: {
  bookingId: string;
  service: string;
  date: string;
  time: string;
  amount: string;
  customerName: string;
  customerEmail: string;
  companyName: string;
  supportEmail: string;
  supportPhone: string;
}) => {
  const subject = `New booking request: ${data.companyName} `;
  const copyRightYear = format(new Date(), "yyyy");
  const html = loadTemplate("booking-request.template", {
    ...data,
    copyRightYear
  });

  await sendEmail(data.customerEmail, subject, html);
};

export const sendBookingRequestSubmissionEmailToAdmin = async (data: {
  bookingId: string;
  service: string;
  date: string;
  time: string;
  amount: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  companyName: string;
}) => {
  const subject = `New booking request submitted from ${data.customerName} `;
  const copyRightYear = format(new Date(), "yyyy");
  const html = loadTemplate("booking-request-admin.template", {
    ...data,
    copyRightYear
  });

  await sendEmail(process.env.ADMIN_EMAIL || (config.get("server.adminEmail") as string), subject, html);
};

export const sendBookingConfirmationEmail = async (data: {
  bookingId: string;
  service: string;
  date: string;
  time: string;
  amount: string;
  customerName: string;
  customerEmail: string;
  companyName: string;
  supportEmail: string;
  supportPhone: string;
}) => {
  const subject = `Booking confirmed: ${data.companyName} `;
  const copyRightYear = format(new Date(), "yyyy");
  const html = loadTemplate("booking-confirm.template", {
    ...data,
    copyRightYear
  });

  await sendEmail(data.customerEmail, subject, html);
};

export const sendReviewRequestEmail = async (
  to: string,
  companyName: string,
  companyEmail: string,
  companyPhone: string,
  reviewLink: string
) => {
  const subject = `We value your feedback! Please share your review.`;
  const copyRightYear = format(new Date(), "yyyy");
  const html = loadTemplate("review-request.template", {
    copyRightYear,
    companyName,
    companyEmail,
    companyPhone,
    websiteLink: "https://royalthreadingandbeauty.com.au",
    reviewLink
  });

  await sendEmail(to, subject, html);
};
