import admin from "firebase-admin";
import config from "config";
import { logger } from "../utils";

export const initializeFirebase = async () => {
  try {
    const firebaseConfig: admin.ServiceAccount = {
      projectId: config.get("firebase.projectId") as string,
      privateKey: (config.get("firebase.privateKey") as string).replace(/\\n/g, "\n"),
      clientEmail: config.get("firebase.clientEmail") as string
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
