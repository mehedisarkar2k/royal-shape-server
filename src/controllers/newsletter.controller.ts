import { Request, Response } from "express";
import { v4 as uuid } from "uuid";
import { ApplicationServices, UNEXPECTED_ERROR } from "../constants";
import { SendErrorResponse, SendResponse, sendEmail, logger } from "../utils";
import {
  countSubscribers,
  findActiveSubscribers,
  findAllSubscribersPaginated,
  subscribeEmail,
  unsubscribeByToken
} from "../services";
import { SubscriberStatus } from "../model";
import { SubscribeInput, SendCampaignInput } from "../schemas";

const buildErrorPayload = (
  endpoint: string,
  functionName: string,
  method: string,
  message: string,
  error: { code: string; message: string },
  customMsg: string
) => ({
  message,
  data: {
    clientError: { ...error, message: customMsg },
    endpoint,
    functionName,
    method,
    service: ApplicationServices.ENGAGEMENT,
    id: uuid()
  }
});

const unsubscribeUrl = (token: string) =>
  `${process.env.SERVER_BASE_URL || ""}/api/public/newsletter/unsubscribe?token=${token}`;

/** Public: subscribe an email to the newsletter. */
export async function subscribePublicHandler(
  req: Request<Record<string, never>, Response, SubscribeInput>,
  res: Response
) {
  const functionName = subscribePublicHandler.name;
  try {
    await subscribeEmail(req.body.email, "footer");
    return SendResponse.success({ res, message: "Subscribed successfully", data: { subscribed: true } });
  } catch (error) {
    return SendErrorResponse.internalServer({
      res,
      ...buildErrorPayload(
        req.originalUrl,
        functionName,
        req.method,
        "Failed to subscribe",
        UNEXPECTED_ERROR,
        (error as Error).message
      )
    });
  }
}

/** Public: one-click unsubscribe (link target). Returns a simple HTML page. */
export async function unsubscribePublicHandler(req: Request, res: Response) {
  const token = (req.query.token as string) || "";
  const subscriber = token ? await unsubscribeByToken(token) : null;
  const message = subscriber
    ? "You've been unsubscribed. You will no longer receive our newsletter."
    : "This unsubscribe link is invalid or has already been used.";

  res.status(200).send(
    `<!doctype html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/>
    <title>Unsubscribe</title></head>
    <body style="font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;background:#f4f5f7;margin:0;padding:48px 16px;text-align:center;color:#111">
      <div style="max-width:460px;margin:0 auto;background:#fff;border-radius:16px;padding:32px;box-shadow:0 8px 24px rgba(0,0,0,.08)">
        <h2 style="margin:0 0 12px;color:#1a1a1a">Royal Threading &amp; Beauty</h2>
        <p style="color:#374151;line-height:1.6">${message}</p>
      </div>
    </body></html>`
  );
}

/** Admin: list subscribers (paginated) + counts. */
export async function getSubscribersHandler(req: Request, res: Response) {
  const page = parseInt((req.query.page as string) || "1", 10);
  const limit = parseInt((req.query.limit as string) || "50", 10);

  const [items, total, subscribed] = await Promise.all([
    findAllSubscribersPaginated(page, limit),
    countSubscribers(),
    countSubscribers(SubscriberStatus.SUBSCRIBED)
  ]);

  return SendResponse.success({
    res,
    message: "Subscribers fetched",
    data: {
      items: items.map((s) => ({
        id: s._id.toString(),
        email: s.email,
        status: s.status,
        source: s.source,
        createdAt: s.createdAt
      })),
      total,
      subscribed,
      currentPage: page,
      totalPages: Math.ceil(total / limit)
    }
  });
}

/** Admin: send a campaign to all active subscribers (each with an unsubscribe link). */
export async function sendCampaignHandler(
  req: Request<Record<string, never>, Response, SendCampaignInput>,
  res: Response
) {
  const functionName = sendCampaignHandler.name;
  const { subject, html } = req.body;

  try {
    const subscribers = await findActiveSubscribers();
    let sent = 0;

    for (const sub of subscribers) {
      const footer = `<div style="margin-top:24px;font-size:12px;color:#9ca3af;text-align:center">
        You're receiving this because you subscribed at Royal Threading &amp; Beauty.
        <a href="${unsubscribeUrl(sub.unsubscribeToken)}" style="color:#9ca3af">Unsubscribe</a>.</div>`;
      try {
        // eslint-disable-next-line no-await-in-loop
        await sendEmail(sub.email, subject, `${html}${footer}`);
        sent += 1;
      } catch (err) {
        logger.error(`Campaign send failed for ${sub.email}: ${(err as Error).message}`);
      }
    }

    return SendResponse.success({
      res,
      message: `Campaign sent to ${sent} subscriber(s)`,
      data: { sent, total: subscribers.length }
    });
  } catch (error) {
    return SendErrorResponse.internalServer({
      res,
      ...buildErrorPayload(
        req.originalUrl,
        functionName,
        req.method,
        "Failed to send campaign",
        UNEXPECTED_ERROR,
        (error as Error).message
      )
    });
  }
}
