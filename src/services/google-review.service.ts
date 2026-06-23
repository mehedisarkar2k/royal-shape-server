import axios from "axios";
import { google } from "googleapis";
import { BranchModel, GoogleReviewModel } from "../model";
import { logger } from "../utils";

const ACCOUNT_MGMT_BASE = "https://mybusinessaccountmanagement.googleapis.com/v1";
const BUSINESS_INFO_BASE = "https://mybusinessbusinessinformation.googleapis.com/v1";
const GBP_V4_BASE = "https://mybusiness.googleapis.com/v4";

const STAR_MAP: Record<string, number> = {
  ONE: 1,
  TWO: 2,
  THREE: 3,
  FOUR: 4,
  FIVE: 5
};

interface GoogleReviewApiItem {
  reviewId: string;
  reviewer?: { displayName?: string; profilePhotoUrl?: string };
  starRating?: string;
  comment?: string;
  createTime?: string;
  updateTime?: string;
  reviewReply?: { comment?: string; updateTime?: string };
}

let cachedToken: { value: string; expiresAt: number } | null = null;

/** Returns a valid OAuth access token, minted from the stored refresh token. */
async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.value;
  }

  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN || process.env.GOOGLE_OAUTH_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      "Google OAuth env vars are missing (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET / GOOGLE_REFRESH_TOKEN)."
    );
  }

  const oauth2 = new google.auth.OAuth2(clientId, clientSecret);
  oauth2.setCredentials({ refresh_token: refreshToken });
  const { token } = await oauth2.getAccessToken();
  if (!token) throw new Error("Failed to obtain Google access token from refresh token.");

  cachedToken = { value: token, expiresAt: Date.now() + 50 * 60 * 1000 };
  return token;
}

async function authedGet<T>(url: string): Promise<T> {
  const token = await getAccessToken();
  const res = await axios.get<T>(url, { headers: { Authorization: `Bearer ${token}` } });
  return res.data;
}

/** First account resource name, e.g. "accounts/123". */
async function getPrimaryAccountName(): Promise<string> {
  const data = await authedGet<{ accounts?: Array<{ name: string }> }>(`${ACCOUNT_MGMT_BASE}/accounts`);
  const account = data.accounts?.[0];
  if (!account) throw new Error("No Google Business Profile account found for this token.");
  return account.name;
}

export async function listGoogleLocations(): Promise<Array<{ name: string; title: string }>> {
  const accountName = await getPrimaryAccountName();
  const url = `${BUSINESS_INFO_BASE}/${accountName}/locations?readMask=name,title&pageSize=100`;
  const data = await authedGet<{ locations?: Array<{ name: string; title?: string }> }>(url);
  return (data.locations || []).map((l) => ({ name: l.name, title: l.title || "" }));
}

/**
 * Auto-assign each branch's `googleLocationId` by matching the Google location
 * title against the branch name (case-insensitive containment). Saves matches
 * and returns a summary so the admin doesn't have to paste IDs by hand.
 */
export async function autoMapBranchLocations(): Promise<
  { branchId: string; branchName: string; locationId: string }[]
> {
  const locations = await listGoogleLocations();
  const branches = await BranchModel.find({});
  const mapped: { branchId: string; branchName: string; locationId: string }[] = [];

  for (const branch of branches) {
    const bn = branch.name.toLowerCase().trim();
    const match = locations.find((l) => {
      const t = l.title.toLowerCase().trim();
      return t === bn || t.includes(bn) || bn.includes(t);
    });
    if (match) {
      branch.googleLocationId = match.name;
      // eslint-disable-next-line no-await-in-loop
      await branch.save();
      mapped.push({ branchId: branch._id.toString(), branchName: branch.name, locationId: match.name });
    }
  }

  return mapped;
}

async function listReviewsForLocation(accountName: string, locationName: string): Promise<GoogleReviewApiItem[]> {
  const reviews: GoogleReviewApiItem[] = [];
  let pageToken: string | undefined;

  do {
    const url =
      `${GBP_V4_BASE}/${accountName}/${locationName}/reviews?pageSize=50` +
      (pageToken ? `&pageToken=${pageToken}` : "");
    const data = await authedGet<{ reviews?: GoogleReviewApiItem[]; nextPageToken?: string }>(url);
    reviews.push(...(data.reviews || []));
    pageToken = data.nextPageToken;
  } while (pageToken);

  return reviews;
}

/**
 * Pull reviews for every branch that has a `googleLocationId`, upserting them
 * into the GoogleReview collection. Returns a per-branch summary.
 */
export async function syncGoogleReviews(): Promise<{ branchId: string; synced: number }[]> {
  const accountName = await getPrimaryAccountName();
  const branches = await BranchModel.find({ googleLocationId: { $ne: null } }).lean();

  const summary: { branchId: string; synced: number }[] = [];

  for (const branch of branches) {
    const locationName = branch.googleLocationId as string; // e.g. "locations/123"
    let items: GoogleReviewApiItem[] = [];
    try {
      // eslint-disable-next-line no-await-in-loop
      items = await listReviewsForLocation(accountName, locationName);
    } catch (error) {
      logger.error(`Failed to fetch Google reviews for branch ${branch._id}: ${(error as Error).message}`);
      continue;
    }

    for (const item of items) {
      // eslint-disable-next-line no-await-in-loop
      await GoogleReviewModel.updateOne(
        { googleReviewId: item.reviewId },
        {
          $set: {
            branchId: branch._id.toString(),
            locationName,
            reviewerName: item.reviewer?.displayName || "Anonymous",
            reviewerPhoto: item.reviewer?.profilePhotoUrl || null,
            starRating: item.starRating ? STAR_MAP[item.starRating] || 0 : 0,
            comment: item.comment || null,
            reviewCreateTime: item.createTime ? new Date(item.createTime) : null,
            reviewUpdateTime: item.updateTime ? new Date(item.updateTime) : null,
            reply: item.reviewReply?.comment
              ? {
                  comment: item.reviewReply.comment,
                  updateTime: item.reviewReply.updateTime ? new Date(item.reviewReply.updateTime) : null
                }
              : null
          },
          // Only set moderation defaults on first insert; never clobber admin choices.
          $setOnInsert: { showInWebsite: false, isHidden: false }
        },
        { upsert: true }
      );
    }

    summary.push({ branchId: branch._id.toString(), synced: items.length });
  }

  return summary;
}

/** Post (or update) a reply to a Google review; mirrors it locally. */
export async function replyToGoogleReview(googleReviewDocId: string, comment: string) {
  const review = await GoogleReviewModel.findById(googleReviewDocId);
  if (!review) throw new Error("Review not found");

  const accountName = await getPrimaryAccountName();
  const token = await getAccessToken();
  const url = `${GBP_V4_BASE}/${accountName}/${review.locationName}/reviews/${review.googleReviewId}/reply`;

  await axios.put(url, { comment }, { headers: { Authorization: `Bearer ${token}` } });

  review.reply = { comment, updateTime: new Date() };
  await review.save();
  return review;
}

/** Delete the business reply from a Google review; mirrors locally. */
export async function deleteGoogleReviewReply(googleReviewDocId: string) {
  const review = await GoogleReviewModel.findById(googleReviewDocId);
  if (!review) throw new Error("Review not found");

  const accountName = await getPrimaryAccountName();
  const token = await getAccessToken();
  const url = `${GBP_V4_BASE}/${accountName}/${review.locationName}/reviews/${review.googleReviewId}/reply`;

  await axios.delete(url, { headers: { Authorization: `Bearer ${token}` } });

  review.reply = null;
  await review.save();
  return review;
}
