import { format } from "date-fns";
import config from "config";
import { EmailService } from "../services/email/email.service";

export const sendEmail = async (to: string, subject: string, html: string) => {
  return await EmailService.sendEmail({ to, subject, html });
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
  const html = EmailService.loadTemplate("contact-us", {
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
  const html = EmailService.loadTemplate("booking-request", {
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
  const html = EmailService.loadTemplate("booking-request-admin", {
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
  const html = EmailService.loadTemplate("booking-confirm", {
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
  const html = EmailService.loadTemplate("review-request", {
    copyRightYear,
    companyName,
    companyEmail,
    companyPhone,
    websiteLink: "https://royalthreadingandbeauty.com.au",
    reviewLink
  });

  await sendEmail(to, subject, html);
};
