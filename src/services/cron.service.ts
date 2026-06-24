import cron from "node-cron";
import { format, differenceInHours } from "date-fns";
import { BookingModel, AdminSettingsModel, CustomerModel, BranchModel, BusinessInfoModel } from "../model";
import { logger } from "../utils/logger";
import { sendAppointmentReminderEmail } from "../utils/send-email";
import { sendSms } from "../utils/send-sms";
import { BookingStatus, BookingServiceType } from "../constants";
import { findServicesByIds } from "./business-service.service";
import { findComboById } from "./combo.service";
import { syncGoogleReviews } from "./google-review.service";

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

    // Sync Google reviews once daily at 03:00 Australian time (lowest server load).
    cron.schedule(
      "0 3 * * *",
      async () => {
        logger.info("Running Google Reviews Sync Cron Job");
        await this.processGoogleReviewsSync();
      },
      { timezone: "Australia/Sydney" }
    );
  }

  static async processGoogleReviewsSync() {
    try {
      const summary = await syncGoogleReviews();
      const total = summary.reduce((sum, b) => sum + b.synced, 0);
      logger.info(`Google reviews sync complete: ${total} reviews across ${summary.length} branch(es).`);
    } catch (error) {
      // Until the Business Profile API access is approved this will 429 — log and move on.
      logger.error(`Google reviews sync failed: ${(error as Error).message}`);
    }
  }

  static async processReminders() {
    try {
      const settings = await AdminSettingsModel.findOne();
      const reminders = settings?.reminders || {
        enable3DayReminder: true,
        enable24HourReminder: true,
        enable6HourReminder: true,
        enable24HourSms: true
      };

      const now = new Date();
      // Reminders go only to CONFIRMED, future bookings.
      const upcomingBookings = await BookingModel.find({
        bookingDate: { $gte: now },
        status: BookingStatus.CONFIRMED
      }).lean();

      for (const booking of upcomingBookings) {
        // booking.startTime is "HH:mm" (e.g. "14:00")
        const [hours, minutes] = booking.startTime.split(":").map(Number);
        const bookingDateTime = new Date(booking.bookingDate);
        bookingDateTime.setHours(hours, minutes, 0, 0);

        const hoursUntilBooking = differenceInHours(bookingDateTime, now);

        // SMS is sent only at the 24h mark (cost control); 3-day/6h are email-only.
        if (reminders.enable3DayReminder && hoursUntilBooking === 72) {
          // eslint-disable-next-line no-await-in-loop
          await this.sendReminder(booking, "3 days", false);
        }
        if (reminders.enable24HourReminder && hoursUntilBooking === 24) {
          // eslint-disable-next-line no-await-in-loop
          await this.sendReminder(booking, "24 hours", reminders.enable24HourSms !== false);
        }
        if (reminders.enable6HourReminder && hoursUntilBooking === 6) {
          // eslint-disable-next-line no-await-in-loop
          await this.sendReminder(booking, "6 hours", false);
        }
      }
    } catch (error) {
      logger.error(`Error processing reminders: ${(error as Error).message}`);
    }
  }

  /** Sends an appointment reminder by email, plus SMS when `withSms` is true. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static async sendReminder(booking: any, timeframe: string, withSms: boolean) {
    try {
      const customer = await CustomerModel.findById(booking.customerId);
      if (!customer) {
        logger.warn(`Reminder skipped — customer not found for booking ${booking._id}`);
        return;
      }

      const branch = await BranchModel.findById(booking.branchId);
      const businessInfo = await BusinessInfoModel.findOne({});
      const companyName = businessInfo?.name || "Royal Threading & Beauty";

      // Resolve the human-readable service/combo name.
      let service = "your appointment";
      if (booking.serviceType === BookingServiceType.COMBO && booking.comboId) {
        const combo = await findComboById(booking.comboId);
        service = combo?.name || service;
      } else if (booking.serviceIds?.length) {
        const services = await findServicesByIds(booking.serviceIds);
        service = services.map((s) => s.name).join(", ") || service;
      }

      const date = format(new Date(booking.bookingDate), "PP");
      const customerName = `${customer.firstName} ${customer.lastName || ""}`.trim() || "Valued Customer";

      // Email
      if (customer.email) {
        await sendAppointmentReminderEmail({
          service,
          branchName: branch?.name || "our salon",
          date,
          time: booking.startTime,
          timeframe,
          customerName,
          customerEmail: customer.email,
          companyName,
          supportEmail: branch?.email || businessInfo?.email || "",
          supportPhone: branch?.phone?.e164 || ""
        });
      }

      // SMS (24h only)
      if (withSms && customer.phone?.e164) {
        const message = `Hi ${customer.firstName || ""}, reminder: your ${service} at ${
          branch?.name || companyName
        } is in ${timeframe} (${date}, ${booking.startTime}). See you soon! — ${companyName}`;
        await sendSms(customer.phone.e164, message);
      }
    } catch (error) {
      logger.error(`Failed to send ${timeframe} reminder for booking ${booking._id}: ${(error as Error).message}`);
    }
  }
}
