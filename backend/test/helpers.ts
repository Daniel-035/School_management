import request from "supertest";
import { createApp } from "../src/app";
import { seedDemoData } from "../src/seed";

const EMAIL_TO_UID: Record<string, string> = {
  "admin@school.local": "u-admin",
  "parent@school.local": "u-parent-1",
  "rohan@school.local": "u-parent-2",
  "staff@school.local": "u-teacher-1",
  "karthik.i@school.local": "u-teacher-2",
};

jest.mock("firebase-admin/auth", () => {
  const userStore = (globalThis as Record<string, unknown>).__firebaseMockUsers as Map<string, { uid: string; email: string; password: string; disabled?: boolean }> | undefined;
  const revokedUids = new Set<string>();
  (globalThis as Record<string, unknown>).__firebaseRevokedUids = revokedUids;
  const store = userStore ?? new Map();
  return {
    getAuth: () => ({
      createUser: jest.fn(async (data: { email: string; password: string; displayName?: string }) => {
        const email = data.email.toLowerCase();
        const uid = EMAIL_TO_UID[email] ?? `test-uid-${Buffer.from(email).toString("hex").slice(0, 20)}`;
        store.set(email, { uid, email, password: data.password, disabled: false });
        revokedUids.delete(uid);
        return { uid, email, displayName: data.displayName };
      }),
      verifyIdToken: jest.fn(async (token: string) => {
        const uid = token.replace("test-id-token-", "");
        if (revokedUids.has(uid)) throw new Error("Token revoked");
        const entry = [...store.values()].find(u => u.uid === uid);
        if (!entry || entry.disabled) throw new Error("User not found or disabled");
        return { uid, email: entry.email, firebase: { sign_in_provider: "password" } };
      }),
      revokeRefreshTokens: jest.fn(async (uid: string) => {
        revokedUids.add(uid);
        const entry = [...store.values()].find(u => u.uid === uid);
        if (entry) entry.disabled = true;
      }),
      updateUser: jest.fn(async (uid: string, data: { disabled?: boolean }) => {
        const entry = [...store.values()].find(u => u.uid === uid);
        if (entry && data.disabled !== undefined) entry.disabled = data.disabled;
      }),
      disableUser: jest.fn(async (uid: string) => {
        const entry = [...store.values()].find(u => u.uid === uid);
        if (entry) entry.disabled = true;
      }),
    }),
  };
});

export const app = createApp();

export async function resetAndSeed(): Promise<void> {
  const store = (globalThis as Record<string, unknown>).__firebaseMockUsers as Map<string, unknown> | undefined;
  store?.clear();
  const revoked = (globalThis as Record<string, unknown>).__firebaseRevokedUids as Set<string> | undefined;
  revoked?.clear();
  const response = await fetch(
    "http://127.0.0.1:8085/emulator/v1/projects/demo-educonnect-test/databases/(default)/documents",
    { method: "DELETE" }
  );
  if (!response.ok) throw new Error(`Firestore emulator reset failed: ${response.status}`);
  await seedDemoData();
}

export async function login(email: string, password: string) {
  const response = await request(app).post("/api/auth/login").send({ email, password }).expect(200);
  return response.body.data as { accessToken: string; refreshToken: string; user: { id: string; role: string } };
}

export function auth(token: string) {
  return { Authorization: `Bearer ${token}` };
}
