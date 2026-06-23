export interface SendSmsOptions {
  /** Recipient phone number in E.164 format, e.g. "+61412345678" */
  to: string;
  /** Plain-text message body */
  message: string;
}

export interface SmsProvider {
  /** Provider name (e.g. "AWS SMS") */
  name: string;

  /** Send an SMS using this provider */
  sendSms(options: SendSmsOptions): Promise<{ success: boolean; messageId?: string; error?: unknown }>;
}
