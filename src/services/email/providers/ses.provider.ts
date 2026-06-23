import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";
import { EmailProvider, SendEmailOptions } from "../../../interfaces/email-provider.interface";
import { logger } from "../../../utils/logger";

export class SesEmailProvider implements EmailProvider {
  name = "AWS SES";
  private client: SESv2Client;
  private fromAddress: string;
  private replyTo?: string;
  private configurationSet?: string;
  private isConfigured: boolean;

  constructor() {
    const region = process.env.AWS_REGION || "ap-southeast-2";
    // Credentials are read from the standard AWS env vars by the SDK's default chain.
    this.client = new SESv2Client({ region });

    const fromEmail = process.env.SES_FROM_EMAIL || "";
    const fromName = process.env.SES_FROM_NAME || "Royal Threading & Beauty";
    this.fromAddress = fromEmail ? `${fromName} <${fromEmail}>` : fromEmail;
    this.replyTo = process.env.SES_REPLY_TO || undefined;
    this.configurationSet = process.env.SES_CONFIGURATION_SET || undefined;
    this.isConfigured = Boolean(fromEmail);

    if (!this.isConfigured) {
      logger.error(`[${this.name}] SES_FROM_EMAIL is not configured! Emails will not be sent.`);
    } else {
      logger.info(`[${this.name}] Provider initialized successfully.`);
    }
  }

  async sendEmail({
    to,
    subject,
    html
  }: SendEmailOptions): Promise<{ success: boolean; messageId?: string; error?: unknown }> {
    if (!this.isConfigured) {
      return { success: false, error: "SES_FROM_EMAIL is missing" };
    }

    try {
      const response = await this.client.send(
        new SendEmailCommand({
          FromEmailAddress: this.fromAddress,
          Destination: { ToAddresses: [to] },
          ...(this.replyTo ? { ReplyToAddresses: [this.replyTo] } : {}),
          ...(this.configurationSet ? { ConfigurationSetName: this.configurationSet } : {}),
          Content: {
            Simple: {
              Subject: { Data: subject, Charset: "UTF-8" },
              Body: { Html: { Data: html, Charset: "UTF-8" } }
            }
          }
        })
      );

      logger.info(`[${this.name}] Email sent successfully to ${to} | Message ID: ${response.MessageId}`);
      return { success: true, messageId: response.MessageId };
    } catch (error) {
      const errorMessage = (error as Error).message;
      logger.error(`[${this.name}] Failed to send email to ${to} | Error: ${errorMessage}`);
      return { success: false, error: errorMessage };
    }
  }
}
