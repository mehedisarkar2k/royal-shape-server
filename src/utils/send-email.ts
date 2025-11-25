/* eslint-disable */

import fs from "fs";
import path from "path";
import nodemailer from "nodemailer";
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

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587, // secure:465 - non-secure:587
  secure: false,
  auth: {
    user: process.env.SMTP_EMAIL || (config.get("smtp.email") as string),
    pass: process.env.SMTP_PASSWORD || (config.get("smtp.password") as string)
  }
});

export const sendEmail = async (to: string, subject: string, html: string) => {
  const mailOptions = {
    from: process.env.SMTP_EMAIL || (config.get("smtp.email") as string),
    to,
    subject,
    html
  };

  console.log("Email options:", mailOptions);

  try {
    await transporter.sendMail(mailOptions);
    logger.info(`Email sent to ${to}`);
  } catch (error) {
    logger.error(`Error sending email to ${to}: ${(error as Error).message}`);
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

  await sendEmail(process.env.SMTP_EMAIL || (config.get("smtp.email") as string), subject, html);
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

  await sendEmail(process.env.SMTP_EMAIL || (config.get("smtp.email") as string), subject, html);
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
