/**
 * Diagnostic: pull Google Business Profile accounts → locations → reviews using
 * the stored refresh token. Confirms (a) API access (no 403) and (b) which
 * Google location maps to which branch.
 *
 * Run:
 *   cd royal-shape-backend
 *   npx ts-node -r dotenv/config scripts/google-reviews-test.ts
 *
 * Needs in .env:
 *   GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET, GOOGLE_OAUTH_REFRESH_TOKEN
 * (client id/secret fall back to ../gcloud_oauth_key.json)
 */
import fs from "fs";
import path from "path";
import axios from "axios";
import { google } from "googleapis";

const CLIENT_ID = process.env.GOOGLE_OAUTH_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_OAUTH_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET;
const REFRESH_TOKEN = process.env.GOOGLE_OAUTH_REFRESH_TOKEN || process.env.GOOGLE_REFRESH_TOKEN;

function loadClient(): { clientId: string; clientSecret: string } {
  if (CLIENT_ID && CLIENT_SECRET) {
    return { clientId: CLIENT_ID, clientSecret: CLIENT_SECRET };
  }
  const keyPath = path.resolve(__dirname, "..", "..", "gcloud_oauth_key.json");
  const web = JSON.parse(fs.readFileSync(keyPath, "utf8")).web;
  return { clientId: web.client_id, clientSecret: web.client_secret };
}

async function getAccessToken(): Promise<string> {
  const { clientId, clientSecret } = loadClient();
  const refreshToken = REFRESH_TOKEN;
  if (!refreshToken) throw new Error("GOOGLE_REFRESH_TOKEN (or GOOGLE_OAUTH_REFRESH_TOKEN) is missing in .env");

  const oauth2 = new google.auth.OAuth2(clientId, clientSecret);
  oauth2.setCredentials({ refresh_token: refreshToken });
  const { token } = await oauth2.getAccessToken();
  if (!token) throw new Error("Failed to obtain access token from refresh token");
  return token;
}

async function get(url: string, token: string) {
  try {
    const res = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
    return res.data;
  } catch (err) {
    const e = err as { response?: { status?: number; data?: unknown }; message: string };
    console.error(`\n✗ ${url}\n  status: ${e.response?.status}\n  body: ${JSON.stringify(e.response?.data)}\n`);
    throw new Error(e.message);
  }
}

async function main() {
  const token = await getAccessToken();
  console.log("✅ Access token obtained from refresh token.\n");

  // 1) Accounts
  const accountsData = await get("https://mybusinessaccountmanagement.googleapis.com/v1/accounts", token);
  const accounts: Array<{ name: string; accountName?: string }> = accountsData.accounts || [];
  console.log(`Accounts (${accounts.length}):`);
  accounts.forEach((a) => console.log(`  - ${a.name}  ${a.accountName || ""}`));

  for (const account of accounts) {
    // 2) Locations
    const locUrl =
      `https://mybusinessbusinessinformation.googleapis.com/v1/${account.name}/locations` +
      `?readMask=name,title,storefrontAddress&pageSize=100`;
    const locData = await get(locUrl, token);
    const locations: Array<{ name: string; title?: string }> = locData.locations || [];
    console.log(`\nLocations for ${account.name} (${locations.length}):`);

    for (const loc of locations) {
      // loc.name is like "locations/123"
      console.log(`  • ${loc.title || "(no title)"}  [${loc.name}]`);

      // 3) Reviews (legacy v4) — needs account + location: accounts/{a}/locations/{l}
      const reviewsUrl = `https://mybusiness.googleapis.com/v4/${account.name}/${loc.name}/reviews`;
      try {
        const reviewsData = await get(reviewsUrl, token);
        const total = reviewsData.totalReviewCount ?? (reviewsData.reviews?.length || 0);
        const avg = reviewsData.averageRating ?? "n/a";
        console.log(`      reviews: ${total}, avg: ${avg}`);
        (reviewsData.reviews || []).slice(0, 3).forEach((r: Record<string, unknown>) => {
          const reviewer = (r.reviewer as { displayName?: string })?.displayName || "Anon";
          console.log(`        - ${r.starRating} by ${reviewer}: ${String(r.comment || "").slice(0, 60)}`);
        });
      } catch {
        console.log("      reviews: FAILED (see error above — likely Business Profile API access not granted)");
      }
    }
  }
  console.log("\nDone.");
}

main().catch((err) => {
  console.error("\nFATAL:", err.message);
  process.exit(1);
});
