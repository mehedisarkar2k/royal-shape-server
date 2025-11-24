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
  port: 465, // secure:465 - non-secure:587
  secure: true,
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
