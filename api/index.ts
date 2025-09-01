import "dotenv/config";

import app from "../src/app";
import { dbConnection } from "../src/utils/db-connection";
import { initializeFirebase } from "../src/services/firebase.service";

// Ensure the database connection and Firebase are initialized before the app is used.
// Vercel will cache this function, so the connection logic only runs on a cold start.
let isInitialized = false;

const initializeApp = async () => {
  if (!isInitialized) {
    await dbConnection();
    await initializeFirebase();
    isInitialized = true;
  }
};

// Use middleware to ensure the app is initialized on every request
// (even though Vercel caches it)
app.use(async (req, res, next) => {
  await initializeApp();
  next();
});

// IMPORTANT: Export the Express app
export default app;
