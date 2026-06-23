import fs from "fs";
import path from "path";
import { EmailProvider, SendEmailOptions } from "../../interfaces/email-provider.interface";
import { BrevoEmailProvider } from "./providers/brevo.provider";
import { SesEmailProvider } from "./providers/ses.provider";
import { logger } from "../../utils/logger";

class EmailServiceManager {
  private activeProvider: EmailProvider;

  constructor() {
    // Active provider is selected by the EMAIL_PROVIDER env var (e.g. "ses" | "brevo").
    // Single sending mechanism — swap providers via config, can also hot-swap at runtime.
    this.activeProvider =
      (process.env.EMAIL_PROVIDER || "").toLowerCase() === "ses" ? new SesEmailProvider() : new BrevoEmailProvider();
    logger.info(`Email service using provider: ${this.activeProvider.name}`);
  }

  /**
   * Dynamically switch the email provider at runtime
   */
  setProvider(provider: EmailProvider) {
    logger.info(`Switching Email Provider to: ${provider.name}`);
    this.activeProvider = provider;
  }

  /**
   * Load an HTML template and inject variables
   */
  loadTemplate(templateName: string, data: Record<string, unknown>): string {
    try {
      const templatePath = path.join(__dirname, "..", "..", "templates", `${templateName}.template.html`);
      let template = fs.readFileSync(templatePath, "utf8");

      const entries = Object.entries(data);
      entries.forEach(([key, value]) => {
        template = template.replace(new RegExp(`{{${key}}}`, "g"), value as string);
      });

      return template;
    } catch (error) {
      logger.error(`Failed to load email template: ${templateName}`);
      throw error;
    }
  }

  /**
   * Send an email using the currently active provider
   */
  async sendEmail(options: SendEmailOptions): Promise<{ success: boolean; messageId?: string; error?: unknown }> {
    return this.activeProvider.sendEmail(options);
  }
}

// Export a singleton instance
export const EmailService = new EmailServiceManager();
