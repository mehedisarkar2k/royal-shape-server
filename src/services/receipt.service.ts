import PDFDocument from "pdfkit";
import fs from "fs";
import os from "os";
import path from "path";
import { uploadFileR2 } from "./r2-storage.service";
import { logger } from "../utils/logger";

interface ReceiptLineItem {
  name: string;
  duration: string;
  price: number;
}

interface ReceiptData {
  bookingId: string;
  shortId: string;
  companyName: string;
  branchName: string;
  branchAddress: string;
  branchPhone: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  lineItems: ReceiptLineItem[];
  date: string;
  startTime: string;
  endTime: string;
  totalPrice: number;
  status: string;
}

const PRIMARY = "#6b0028";
const PRIMARY_SOFT = "#ffe9ea";
const TEXT = "#26181a";
const MUTED = "#584144";
const OUTLINE = "#e0bec2";

function buildReceiptKey(bookingId: string, date: string, startTime: string): string {
  const safeTime = startTime.replace(/[:\s]/g, "-");
  return `invoices/${bookingId}/${date}-${safeTime}.pdf`;
}

function renderReceiptPdf(data: ReceiptData, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 0 });
    const stream = fs.createWriteStream(outputPath);
    doc.pipe(stream);

    const pageWidth = doc.page.width;
    const margin = 50;
    const contentWidth = pageWidth - margin * 2;

    // Top accent bar
    doc.rect(0, 0, pageWidth, 8).fill(PRIMARY);

    let y = 50;

    // Header: title + ref (left), status badge + dates (right)
    doc.font("Helvetica-Bold").fontSize(26).fillColor(PRIMARY).text("INVOICE", margin, y);
    doc
      .font("Helvetica")
      .fontSize(10)
      .fillColor(MUTED)
      .text(`Ref: ${data.shortId}`, margin, y + 32);

    const badgeText = data.status.toUpperCase();
    const badgeWidth = doc.font("Helvetica-Bold").fontSize(9).widthOfString(badgeText) + 24;
    const badgeX = pageWidth - margin - badgeWidth;
    doc.roundedRect(badgeX, y, badgeWidth, 22, 11).fillAndStroke(PRIMARY_SOFT, OUTLINE);
    doc
      .fillColor(PRIMARY)
      .font("Helvetica-Bold")
      .fontSize(9)
      .text(badgeText, badgeX, y + 6, {
        width: badgeWidth,
        align: "center"
      });

    doc
      .font("Helvetica")
      .fontSize(10)
      .fillColor(MUTED)
      .text(`Appointment: ${data.date}`, margin, y + 32, { width: contentWidth, align: "right" })
      .text(`Time: ${data.startTime} - ${data.endTime}`, margin, y + 46, { width: contentWidth, align: "right" });

    y += 80;
    doc
      .moveTo(margin, y)
      .lineTo(pageWidth - margin, y)
      .strokeColor(OUTLINE)
      .stroke();
    y += 30;

    // From / Billed To columns
    const colWidth = contentWidth / 2 - 10;

    doc.font("Helvetica-Bold").fontSize(9).fillColor(MUTED).text("FROM", margin, y, { characterSpacing: 1 });
    doc
      .font("Helvetica-Bold")
      .fontSize(13)
      .fillColor(PRIMARY)
      .text(data.companyName, margin, y + 16);
    doc
      .font("Helvetica")
      .fontSize(10)
      .fillColor(MUTED)
      .text(data.branchName, margin, y + 34)
      .text(data.branchAddress, margin, y + 48, { width: colWidth })
      .text(data.branchPhone, margin, y + 76);

    const col2X = margin + colWidth + 20;
    doc.font("Helvetica-Bold").fontSize(9).fillColor(MUTED).text("BILLED TO", col2X, y, { characterSpacing: 1 });
    doc
      .font("Helvetica-Bold")
      .fontSize(13)
      .fillColor(TEXT)
      .text(data.customerName, col2X, y + 16);
    doc
      .font("Helvetica")
      .fontSize(10)
      .fillColor(MUTED)
      .text(data.customerEmail, col2X, y + 34)
      .text(data.customerPhone, col2X, y + 48);

    y += 110;
    doc
      .moveTo(margin, y)
      .lineTo(pageWidth - margin, y)
      .strokeColor(OUTLINE)
      .stroke();
    y += 25;

    // Services table
    const descX = margin;
    const durX = margin + contentWidth * 0.55;
    const amountX = margin + contentWidth * 0.78;
    const amountWidth = pageWidth - margin - amountX;

    doc.font("Helvetica-Bold").fontSize(9).fillColor(MUTED);
    doc.text("DESCRIPTION", descX, y, { characterSpacing: 1 });
    doc.text("DURATION", durX, y, { characterSpacing: 1 });
    doc.text("AMOUNT", amountX, y, { width: amountWidth, align: "right", characterSpacing: 1 });
    y += 16;
    doc
      .moveTo(margin, y)
      .lineTo(pageWidth - margin, y)
      .strokeColor(PRIMARY)
      .opacity(0.2)
      .stroke()
      .opacity(1);
    y += 14;

    data.lineItems.forEach((item) => {
      doc
        .font("Helvetica")
        .fontSize(11)
        .fillColor(TEXT)
        .text(item.name, descX, y, { width: durX - descX - 10 });
      doc.fillColor(MUTED).text(item.duration, durX, y);
      doc.fillColor(TEXT).text(`AUD ${item.price.toFixed(2)}`, amountX, y, { width: amountWidth, align: "right" });
      y += 24;
      doc
        .moveTo(margin, y - 6)
        .lineTo(pageWidth - margin, y - 6)
        .strokeColor(OUTLINE)
        .opacity(0.5)
        .stroke()
        .opacity(1);
    });

    y += 14;

    // Totals
    const totalsBoxWidth = 220;
    const totalsX = pageWidth - margin - totalsBoxWidth;
    doc
      .font("Helvetica")
      .fontSize(11)
      .fillColor(MUTED)
      .text("Total", totalsX, y, { width: totalsBoxWidth - 100 });
    doc
      .font("Helvetica-Bold")
      .fontSize(16)
      .fillColor(PRIMARY)
      .text(`AUD ${data.totalPrice.toFixed(2)}`, totalsX + (totalsBoxWidth - 100), y - 3, {
        width: 100,
        align: "right"
      });

    y += 40;

    // Payment instructions box
    const boxHeight = 70;
    doc.roundedRect(margin, y, contentWidth, boxHeight, 8).fill(PRIMARY_SOFT);
    doc
      .font("Helvetica-Bold")
      .fontSize(11)
      .fillColor(PRIMARY)
      .text("Payment Instructions", margin + 16, y + 14);
    doc
      .font("Helvetica")
      .fontSize(9.5)
      .fillColor(MUTED)
      .text(
        `Thank you for choosing ${data.companyName}. Payment is collected in-salon at the time of your appointment.`,
        margin + 16,
        y + 32,
        { width: contentWidth - 32 }
      );

    y += boxHeight + 30;

    // Footer
    doc
      .font("Helvetica")
      .fontSize(8.5)
      .fillColor(MUTED)
      .text(
        "This is a booking confirmation invoice, not a tax invoice. Final payment is due at your appointment.",
        margin,
        y,
        { width: contentWidth, align: "center" }
      );

    doc.end();
    stream.on("finish", resolve);
    stream.on("error", reject);
  });
}

/** Generates an invoice PDF and uploads it to R2 under `invoices/<bookingId>/<date>-<time>.pdf`.
 *  Returns the R2 object key on success, or null if generation/upload failed — callers should
 *  treat this as best-effort and not fail the booking itself. */
export async function generateAndUploadReceipt(data: ReceiptData): Promise<string | null> {
  const tempPath = path.join(os.tmpdir(), `invoice-${data.bookingId}-${Date.now()}.pdf`);

  try {
    await renderReceiptPdf(data, tempPath);
    const key = buildReceiptKey(data.bookingId, data.date, data.startTime);
    const result = await uploadFileR2(tempPath, key, true);
    return result.success ? result.key! : null;
  } catch (error) {
    logger.error(`Failed to generate/upload invoice for booking ${data.bookingId}: ${(error as Error).message}`);
    return null;
  } finally {
    fs.unlink(tempPath, () => {});
  }
}
