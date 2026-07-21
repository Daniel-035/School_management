process.env.NODE_ENV = "test";
process.env.FIRESTORE_PROJECT_ID = "demo-educonnect-test";
process.env.GCLOUD_PROJECT = "demo-educonnect-test";
process.env.GOOGLE_CLOUD_PROJECT = "demo-educonnect-test";
process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8085";
process.env.FIREBASE_STORAGE_BUCKET = "demo-educonnect-test.appspot.com";
process.env.FIREBASE_WEB_API_KEY = "test-firebase-web-api-key-placeholder";
process.env.JWT_SECRET = "test-only-jwt-secret-with-at-least-32-characters";
process.env.JWT_EXPIRES_IN = "15m";
process.env.REFRESH_TOKEN_EXPIRES_IN_DAYS = "30";
process.env.BCRYPT_ROUNDS = "10";
process.env.ADMIN_EMAIL = "admin@school.local";
process.env.ADMIN_PASSWORD = "admin123";
process.env.APP_NAME = "EduConnect";
process.env.APP_BASE_URL = "http://localhost:5173";
process.env.CORS_ORIGINS = "http://localhost:5173";
process.env.AUTH_RATE_LIMIT_MAX = "1000";
process.env.SEED_DEMO_DATA = "false";

interface StoredMockUser { uid: string; email: string; password: string; disabled?: boolean; }
const userStore = new Map<string, StoredMockUser>();
(globalThis as Record<string, unknown>).__firebaseMockUsers = userStore;

const realFetch = global.fetch;
global.fetch = (async (input: string | URL, init?: RequestInit) => {
  const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : "";
  const rawBody = init?.body;
  const parsedBody: Record<string, string> = rawBody instanceof URLSearchParams
    ? Object.fromEntries(rawBody.entries())
    : typeof rawBody === "string" ? JSON.parse(rawBody) : {};

  if (url.includes("identitytoolkit.googleapis.com") && url.includes("signInWithPassword")) {
    const email = (parsedBody.email ?? "").toLowerCase();
    const entry = userStore.get(email);
    if (!entry || entry.password !== parsedBody.password || entry.disabled) {
      return new Response(JSON.stringify({ error: { message: "INVALID_PASSWORD" } }), { status: 400, headers: { "Content-Type": "application/json" } });
    }
    return new Response(JSON.stringify({
      idToken: `test-id-token-${entry.uid}`,
      refreshToken: `test-refresh-${entry.uid}`,
      localId: entry.uid,
      expiresIn: "3600",
    }), { status: 200, headers: { "Content-Type": "application/json" } });
  }

  if (url.includes("securetoken.googleapis.com") && url.includes("token")) {
    const refreshToken = parsedBody.refreshToken ?? "";
    const uid = refreshToken.replace("test-refresh-", "");
    const revoked = (globalThis as Record<string, unknown>).__firebaseRevokedUids as Set<string> | undefined;
    if (revoked?.has(uid)) {
      return new Response(JSON.stringify({ error: { message: "USER_DISABLED" } }), { status: 400, headers: { "Content-Type": "application/json" } });
    }
    const entry = [...userStore.values()].find(u => u.uid === uid);
    if (!entry) {
      return new Response(JSON.stringify({ error: { message: "INVALID_REFRESH_TOKEN" } }), { status: 400, headers: { "Content-Type": "application/json" } });
    }
    return new Response(JSON.stringify({
      access_token: `test-id-token-${entry.uid}`,
      refresh_token: `test-refresh-${entry.uid}`,
      user_id: entry.uid,
      expires_in: "3600",
    }), { status: 200, headers: { "Content-Type": "application/json" } });
  }

  return realFetch(input as string | URL, init);
}) as typeof global.fetch;
