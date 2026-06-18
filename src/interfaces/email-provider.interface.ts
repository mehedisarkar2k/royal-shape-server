export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export interface EmailProvider {
  /**
   * The name of the email provider (e.g., "Brevo", "SendGrid", "Nodemailer")
   */
  name: string;

  /**
   * Send an email using this provider
   * @param options The email options
   * @returns A boolean indicating success or failure, or provider-specific response
   */
  sendEmail(options: SendEmailOptions): Promise<{ success: boolean; messageId?: string; error?: unknown }>;
}
