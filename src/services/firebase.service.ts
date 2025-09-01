import admin from "firebase-admin";
import config from "config";
import { logger } from "../utils";

export const initializeFirebase = async () => {
  try {
    const firebaseConfig: admin.ServiceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID || (config.get("firebase.projectId") as string),
      privateKey: (process.env.FIREBASE_PRIVATE_KEY || (config.get("firebase.privateKey") as string)).replace(
        /\\n/g,
        "\n"
      ),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL || (config.get("firebase.clientEmail") as string)
    };

    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(firebaseConfig)
      });
      logger.info("Firebase successfully initialized.");
    } else {
      logger.info("Firebase is already initialized.");
    }
  } catch (error) {
    logger.error("Error initializing Firebase:", error);
    throw error;
  }
};
