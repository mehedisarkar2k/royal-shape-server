import { SmsService } from "../services/sms/sms.service";

/**
 * Send a plain-text SMS to an E.164 number (e.g. "+61412345678").
 * Single entry point for all SMS — provider is chosen by config in SmsService.
 */
export const sendSms = async (to: string, message: string) => {
  return SmsService.sendSms({ to, message });
};
