import axios from "axios";
import config from "config";
import { EmailProvider, SendEmailOptions } from "../../../interfaces/email-provider.interface";
import { logger } from "../../../utils/logger";

export class BrevoEmailProvider implements EmailProvider {
  name = "Brevo";
  private apiUrl = "https://api.brevo.com/v3/smtp/email";
  private apiKey: string;
  private senderEmail: string;
  private senderName: string;

  constructor() {
    this.apiKey = process.env.BREVO_API_KEY || (config.get("brevo.apiKey") as string);
    this.senderEmail = process.env.SENDER_EMAIL || (config.get("brevo.senderEmail") as string);
    this.senderName = process.env.SENDER_NAME || (config.get("brevo.senderName") as string) || "Royal Shape";

    if (!this.apiKey) {
      logger.error(`[${this.name}] API Key is not configured! Emails will not be sent.`);
    } else {
      logger.info(`[${this.name}] Provider initialized successfully.`);
    }
  }

  async sendEmail({
    to,
    subject,
    html
  }: SendEmailOptions): Promise<{ success: boolean; messageId?: string; error?: unknown }> {
    if (!this.apiKey) {
      return { success: false, error: "Brevo API Key is missing" };
    }

    try {
      const response = await axios.post(
        this.apiUrl,
        {
          sender: { email: this.senderEmail, name: this.senderName },
          to: [{ email: to }],
          subject: subject,
          htmlContent: html
        },
        {
          headers: {
            "api-key": this.apiKey,
            "Content-Type": "application/json",
            accept: "application/json"
          },
          timeout: 10000
        }
      );

      logger.info(`[${this.name}] Email sent successfully to ${to} | Message ID: ${response.data.messageId}`);
      return { success: true, messageId: response.data.messageId };
    } catch (error) {
      const axiosError = error as { response?: { data?: { message?: string } }; message: string };
      const errorMessage = axiosError.response?.data?.message || axiosError.message;
      logger.error(`[${this.name}] Failed to send email to ${to} | Error: ${errorMessage}`);
      return { success: false, error: errorMessage };
    }
  }
}
