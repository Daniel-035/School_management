/**
 * Firebase Cloud Functions entry point.
 *
 * The existing Express app (backend/src/app.ts) is reused as-is.
 * Firebase Admin SDK is already initialised inside backend/src/config/firebase.ts,
 * and inside Cloud Functions it uses Application Default Credentials automatically
 * (no service account JSON needed at runtime).
 */
import { onRequest } from "firebase-functions/v2/https";
import { setGlobalOptions } from "firebase-functions/v2";
import { createApp } from "../../backend/src/app";

// Set default region for all functions in this file
setGlobalOptions({ region: "asia-south1", memory: "512MiB" });

// Lazily instantiate the app so it is only created once per cold-start
let expressApp: ReturnType<typeof createApp> | undefined;

function getApp() {
  if (!expressApp) {
    expressApp = createApp();
  }
  return expressApp;
}

/**
 * Main API function — handles all /api/* requests.
 * Firebase Hosting rewrites /api/** to this function.
 */
export const api = onRequest(
  {
    invoker: "public",
    cors: true,
    timeoutSeconds: 60,
  },
  (req, res) => getApp()(req, res),
);
