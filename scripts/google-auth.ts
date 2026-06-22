/**
 * One-time helper to obtain a Google OAuth **refresh token** for the
 * Business Profile API (reviews).
 *
 * Prerequisites:
 *   1. OAuth consent screen published (production) for the business owner account.
 *   2. In Cloud Console → Credentials → your OAuth client → Authorized redirect URIs,
 *      add:  http://localhost:5055/oauth2callback
 *
 * Run:
 *   cd royal-shape-backend
 *   npx ts-node scripts/google-auth.ts
 *
 * It prints a refresh token — put it in .env as GOOGLE_OAUTH_REFRESH_TOKEN.
 *
 * Credentials are read from env (GOOGLE_OAUTH_CLIENT_ID / _SECRET) or, as a
 * fallback, from ../gcloud_oauth_key.json relative to the backend folder.
 */
import http from "http";
import fs from "fs";
import path from "path";
import { google } from "googleapis";

const REDIRECT_URI = "http://localhost:5055/oauth2callback";
const SCOPE = "https://www.googleapis.com/auth/business.manage";

function loadCredentials(): { clientId: string; clientSecret: string } {
  if (process.env.GOOGLE_OAUTH_CLIENT_ID && process.env.GOOGLE_OAUTH_CLIENT_SECRET) {
    return {
      clientId: process.env.GOOGLE_OAUTH_CLIENT_ID,
      clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET
    };
  }
  // Fallback: read the OAuth client JSON kept at the workspace root.
  const keyPath = path.resolve(__dirname, "..", "..", "gcloud_oauth_key.json");
  const raw = JSON.parse(fs.readFileSync(keyPath, "utf8"));
  const web = raw.web || raw.installed;
  if (!web?.client_id || !web?.client_secret) {
    throw new Error("Could not find client_id/client_secret (set env vars or provide gcloud_oauth_key.json).");
  }
  return { clientId: web.client_id, clientSecret: web.client_secret };
}

async function main() {
  const { clientId, clientSecret } = loadCredentials();
  const oauth2 = new google.auth.OAuth2(clientId, clientSecret, REDIRECT_URI);

  const authUrl = oauth2.generateAuthUrl({
    access_type: "offline",
    prompt: "consent", // force a refresh_token even on re-auth
    scope: [SCOPE]
  });

  console.log("\n1) Open this URL in the browser (sign in as the business owner):\n");
  console.log(authUrl + "\n");

  await new Promise<void>((resolve) => {
    const server = http.createServer(async (req, res) => {
      if (!req.url?.startsWith("/oauth2callback")) {
        res.writeHead(404).end();
        return;
      }
      const code = new URL(req.url, REDIRECT_URI).searchParams.get("code");
      if (!code) {
        res.writeHead(400).end("Missing code");
        return;
      }
      try {
        const { tokens } = await oauth2.getToken(code);
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end("<h2>Done. You can close this tab and return to the terminal.</h2>");
        console.log("\n✅ Tokens received.\n");
        console.log("GOOGLE_OAUTH_REFRESH_TOKEN=" + (tokens.refresh_token || "(none returned)"));
        if (!tokens.refresh_token) {
          console.log(
            "\n⚠️  No refresh_token returned. Revoke prior access at https://myaccount.google.com/permissions and re-run."
          );
        }
        console.log("");
      } catch (err) {
        res.writeHead(500).end("Token exchange failed");
        console.error("Token exchange failed:", (err as Error).message);
      } finally {
        server.close();
        resolve();
      }
    });
    server.listen(5055, () => console.log("2) Waiting for Google redirect on " + REDIRECT_URI + " ...\n"));
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
