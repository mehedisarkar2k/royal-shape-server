import { randomBytes } from "crypto";
import { SubscriberModel, SubscriberStatus } from "../model";

export async function subscribeEmail(email: string, source = "website") {
  const normalized = email.toLowerCase().trim();
  const existing = await SubscriberModel.findOne({ email: normalized });

  if (existing) {
    // Re-subscribe if they had previously unsubscribed.
    if (existing.status === SubscriberStatus.UNSUBSCRIBED) {
      existing.status = SubscriberStatus.SUBSCRIBED;
      await existing.save();
    }
    return existing;
  }

  return SubscriberModel.create({
    email: normalized,
    status: SubscriberStatus.SUBSCRIBED,
    unsubscribeToken: randomBytes(24).toString("hex"),
    source
  });
}

export async function unsubscribeByToken(token: string) {
  const subscriber = await SubscriberModel.findOne({ unsubscribeToken: token });
  if (!subscriber) return null;
  subscriber.status = SubscriberStatus.UNSUBSCRIBED;
  await subscriber.save();
  return subscriber;
}

export function findActiveSubscribers() {
  return SubscriberModel.find({ status: SubscriberStatus.SUBSCRIBED }).sort({ createdAt: -1 }).lean();
}

export function findAllSubscribersPaginated(page: number, limit: number) {
  return SubscriberModel.find()
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();
}

export function countSubscribers(status?: SubscriberStatus) {
  return SubscriberModel.countDocuments(status ? { status } : {});
}
