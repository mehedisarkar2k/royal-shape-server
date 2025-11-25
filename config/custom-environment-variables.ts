export default {
  server: {
    port: "PORT",
    host: "SERVER_BASE_URL",
    projectName: "PROJECT_NAME",
    environment: "ENVIRONMENT",
    clientBaseUrl: "CLIENT_BASE_URL"
  },
  db: {
    uri: "MONGODB_URI"
  },
  smtp: {
    email: "SMTP_EMAIL",
    password: "SMTP_PASSWORD"
  },
  firebase: {
    projectId: "FIREBASE_PROJECT_ID",
    privateKey: "FIREBASE_PRIVATE_KEY",
    clientEmail: "FIREBASE_CLIENT_EMAIL"
  },
  auth: {
    accessTokenPublicKey: "ACCESS_TOKEN_PUBLIC_KEY",
    accessTokenPrivateKey: "ACCESS_TOKEN_PRIVATE_KEY",
    accessTokenExpiry: "ACCESS_TOKEN_EXPIRY",
    refreshTokenPublicKey: "REFRESH_TOKEN_PUBLIC_KEY",
    refreshTokenPrivateKey: "REFRESH_TOKEN_PRIVATE_KEY",
    refreshTokenExpiry: "REFRESH_TOKEN_EXPIRY"
  }
};
