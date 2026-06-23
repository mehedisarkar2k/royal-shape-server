import { SmsProvider, SendSmsOptions } from "../../interfaces/sms-provider.interface";
import { AwsSmsProvider } from "./providers/aws-sms.provider";
import { logger } from "../../utils/logger";

class SmsServiceManager {
  private activeProvider: SmsProvider;

  constructor() {
    // Single mechanism — provider selected by SMS_PROVIDER env (default: AWS).
    // Mirrors the email provider pattern so the gateway can be swapped via config.
    switch ((process.env.SMS_PROVIDER || "aws").toLowerCase()) {
      case "aws":
      default:
        this.activeProvider = new AwsSmsProvider();
    }
    logger.info(`SMS service using provider: ${this.activeProvider.name}`);
  }

  setProvider(provider: SmsProvider) {
    logger.info(`Switching SMS provider to: ${provider.name}`);
    this.activeProvider = provider;
  }

  async sendSms(options: SendSmsOptions): Promise<{ success: boolean; messageId?: string; error?: unknown }> {
    return this.activeProvider.sendSms(options);
  }
}

export const SmsService = new SmsServiceManager();
