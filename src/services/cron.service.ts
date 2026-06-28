import cron from "node-cron";
import { format, differenceInHours } from "date-fns";
import { BookingModel, AdminSettingsModel, CustomerModel, BranchModel, BusinessInfoModel } from "../model";
import { logger } from "../utils/logger";
import { sendAppointmentReminderEmail } from "../utils/send-email";
import { sendSms } from "../utils/send-sms";
import { BookingStatus, BookingServiceType, ReminderChannel } from "../constants";
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
        reminder24Hour: ReminderChannel.EMAIL,
        reminder2Hour: ReminderChannel.EMAIL
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

        if (hoursUntilBooking === 24 && reminders.reminder24Hour !== ReminderChannel.OFF) {
          // eslint-disable-next-line no-await-in-loop
          await this.sendReminder(booking, "24 hours", reminders.reminder24Hour);
        }
        if (hoursUntilBooking === 2 && reminders.reminder2Hour !== ReminderChannel.OFF) {
          // eslint-disable-next-line no-await-in-loop
          await this.sendReminder(booking, "2 hours", reminders.reminder2Hour);
        }
      }
    } catch (error) {
      logger.error(`Error processing reminders: ${(error as Error).message}`);
    }
  }

  /** Sends an appointment reminder by email and/or SMS per the configured channel. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static async sendReminder(booking: any, timeframe: string, channel: ReminderChannel) {
    const withEmail = channel === ReminderChannel.EMAIL || channel === ReminderChannel.BOTH;
    const withSms = channel === ReminderChannel.SMS || channel === ReminderChannel.BOTH;
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
      if (withEmail && customer.email) {
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

      // SMS
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
