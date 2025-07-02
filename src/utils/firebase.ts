import admin, { ServiceAccount } from "firebase-admin";
import config from "config";

export const initFirebaseAdmin = () => {
  if (admin.apps.length === 0) {
    const serviceAccount: ServiceAccount = {
      projectId: config.get<string>("firebase.projectId"),
      privateKey: config.get<string>("firebase.privateKey")?.replace(/\\n/g, "\n"),
      clientEmail: config.get<string>("firebase.clientEmail")
    };

    // Initialize Firebase Admin with the service account
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  }

  return admin;
};

export type FirebaseAdminType = typeof admin;
