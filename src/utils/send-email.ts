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
  host: "mail.privateemail.com",
  port: 587, // secure:465
  auth: {
    user: config.get("smtp.email") as string,
    pass: config.get("smtp.password") as string
  }
});

export const sendEmail = async (to: string, subject: string, html: string) => {
  const mailOptions = {
    from: config.get("smtp.email") as string,
    to,
    subject,
    html
  };

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
  phone,
  meetingType,
  preferredDate,
  message
}: {
  name: string;
  email: string;
  phone: { countryCode: string; number: string };
  meetingType: string;
  preferredDate: string;
  message: string;
}) => {
  const subject = `${name} submitted a request from contact section.`;
  const copyRightYear = format(new Date(), "yyyy");
  const html = loadTemplate("contact-us.template", {
    name,
    email,
    phone: `${phone.countryCode} ${phone.number}`,
    meetingType,
    preferredDate,
    message,
    copyRightYear
  });

  await sendEmail(config.get("smtp.email") as string, subject, html);
};
