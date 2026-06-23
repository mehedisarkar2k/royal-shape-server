import { PinpointSMSVoiceV2Client, SendTextMessageCommand } from "@aws-sdk/client-pinpoint-sms-voice-v2";
import { SmsProvider, SendSmsOptions } from "../../../interfaces/sms-provider.interface";
import { logger } from "../../../utils/logger";

export class AwsSmsProvider implements SmsProvider {
  name = "AWS SMS";
  private client: PinpointSMSVoiceV2Client;
  private senderId?: string;
  private configurationSet?: string;

  constructor() {
    const region = process.env.AWS_REGION || "ap-southeast-2";
    // Credentials come from the standard AWS env vars via the SDK default chain.
    this.client = new PinpointSMSVoiceV2Client({ region });
    this.senderId = process.env.SMS_SENDER_ID || undefined;
    this.configurationSet = process.env.SMS_CONFIGURATION_SET || undefined;
    logger.info(`[${this.name}] Provider initialized (senderId: ${this.senderId || "default"}).`);
  }

  async sendSms({ to, message }: SendSmsOptions): Promise<{ success: boolean; messageId?: string; error?: unknown }> {
    try {
      const response = await this.client.send(
        new SendTextMessageCommand({
          DestinationPhoneNumber: to,
          MessageBody: message,
          MessageType: "TRANSACTIONAL",
          ...(this.senderId ? { SenderId: this.senderId } : {}),
          ...(this.configurationSet ? { ConfigurationSetName: this.configurationSet } : {})
        })
      );

      logger.info(`[${this.name}] SMS sent to ${to} | Message ID: ${response.MessageId}`);
      return { success: true, messageId: response.MessageId };
    } catch (error) {
      const errorMessage = (error as Error).message;
      logger.error(`[${this.name}] Failed to send SMS to ${to} | Error: ${errorMessage}`);
      return { success: false, error: errorMessage };
    }
  }
}
