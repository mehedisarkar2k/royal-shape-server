import cron from "node-cron";
import { format, differenceInHours } from "date-fns";
import { BookingModel } from "../model";
import { AdminSettingsModel } from "../model";
import { EmailService } from "./email/email.service";
import { logger } from "../utils/logger";
import { BookingStatus } from "../constants";

export class CronService {
  /**
   * Starts all application cron jobs
   */
  static start() {
    logger.info("Starting Cron Scheduler...");

    // Run every hour at minute 0
    cron.schedule("0 * * * *", async () => {
      logger.info("Running Booking Reminder Cron Job");
      await this.processReminders();
    });
  }

  static async processReminders() {
    try {
      const settings = await AdminSettingsModel.findOne();
      const remindersEnabled = settings?.reminders || {
        enable3DayReminder: true,
        enable24HourReminder: true,
        enable6HourReminder: true
      };

      const now = new Date();
      // Only process future bookings that are pending or confirmed
      const upcomingBookings = await BookingModel.find({
        bookingDate: { $gte: now },
        status: { $in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] }
      }).lean();

      for (const booking of upcomingBookings) {
        // Parse booking time
        // Note: booking.startTime is "HH:mm" (e.g. "14:00")
        const [hours, minutes] = booking.startTime.split(":").map(Number);
        const bookingDateTime = new Date(booking.bookingDate);
        bookingDateTime.setHours(hours, minutes, 0, 0);

        const hoursUntilBooking = differenceInHours(bookingDateTime, now);

        // Check 3 days (72 hours)
        if (remindersEnabled.enable3DayReminder && hoursUntilBooking === 72) {
          // eslint-disable-next-line no-await-in-loop
          await this.sendReminderEmail(booking, "3 Days");
        }

        // Check 24 hours
        if (remindersEnabled.enable24HourReminder && hoursUntilBooking === 24) {
          // eslint-disable-next-line no-await-in-loop
          await this.sendReminderEmail(booking, "24 Hours");
        }

        // Check 6 hours
        if (remindersEnabled.enable6HourReminder && hoursUntilBooking === 6) {
          // eslint-disable-next-line no-await-in-loop
          await this.sendReminderEmail(booking, "6 Hours");
        }
      }
    } catch (error) {
      logger.error(`Error processing reminders: ${(error as Error).message}`);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static async sendReminderEmail(booking: any, timeframe: string) {
    // eslint-disable-line 
    try {
      const subject = `Reminder: Your appointment is in ${timeframe}`;

      const { CustomerModel } = await import("../model");
      const customer = await CustomerModel.findById(booking.customerId);

      if (!customer || !customer.email) {
        logger.warn(`Customer not found for booking ${booking._id}`);
        return;
      }

      // In a real scenario we might have an actual 'appointment-reminder' template
      // We will fallback to a default email text if template doesn't exist
      try {
        const html = EmailService.loadTemplate("appointment-reminder", {
          customerName: customer.firstName || "Valued Customer",
          service: booking.serviceType,
          date: format(new Date(booking.bookingDate), "PP"),
          time: booking.startTime,
          timeframe: timeframe,
          companyName: "Royal Shape",
          copyRightYear: format(new Date(), "yyyy")
        });
        await EmailService.sendEmail({ to: customer.email as string, subject, html });
      } catch (e) {
        // Fallback if template is missing
        const html = `<p>Hi ${customer.firstName || "Valued Customer"},</p><p>This is a reminder that your appointment is in ${timeframe}.</p>`;
        await EmailService.sendEmail({ to: customer.email as string, subject, html });
      }
    } catch (error) {
      logger.error(`Failed to send ${timeframe} reminder for booking ${booking._id}: ${(error as Error).message}`);
    }
  }
}
