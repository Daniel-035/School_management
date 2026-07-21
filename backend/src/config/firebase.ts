import { applicationDefault, cert, getApps, initializeApp, ServiceAccount } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";
import { getStorage } from "firebase-admin/storage";
import { env } from "./env";

function parseServiceAccount(value: string): ServiceAccount {
  try {
    const parsed = JSON.parse(value) as Record<string, unknown>;
    const projectId = parsed.project_id;
    const clientEmail = parsed.client_email;
    const privateKey = parsed.private_key;

    if (typeof projectId !== "string" || typeof clientEmail !== "string" || typeof privateKey !== "string") {
      throw new Error("project_id, client_email, and private_key are required");
    }
    if (env.FIRESTORE_PROJECT_ID && env.FIRESTORE_PROJECT_ID !== projectId) {
      throw new Error("FIRESTORE_PROJECT_ID does not match the service account project_id");
    }

    return { projectId, clientEmail, privateKey };
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown parse error";
    throw new Error(`Invalid FIREBASE_SERVICE_ACCOUNT: ${message}`);
  }
}

const app = getApps()[0] ?? initializeApp({
  ...(!process.env.FIRESTORE_EMULATOR_HOST && {
    credential: env.FIREBASE_SERVICE_ACCOUNT
      ? cert(parseServiceAccount(env.FIREBASE_SERVICE_ACCOUNT))
      : applicationDefault(),
  }),
  projectId: env.FIRESTORE_PROJECT_ID,
  storageBucket: env.FIREBASE_STORAGE_BUCKET,
});

export const db = getFirestore(app);
export const auth = getAuth(app);
export const bucket = getStorage(app).bucket();
export const messaging = getMessaging(app);
