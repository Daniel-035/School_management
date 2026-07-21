import { messaging } from "../config/firebase";
import { db } from "../config/firebase";

export interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

export interface PushResult {
  status: "sent" | "partial" | "failed";
  successCount: number;
  failureCount: number;
  attempted: number;
}

const IN_CLAUSE_LIMIT = 30;

export async function sendPushToTokens(tokens: string[], payload: PushPayload): Promise<PushResult> {
  const attempted = tokens.length;
  if (attempted === 0) {
    return { status: "failed", successCount: 0, failureCount: 0, attempted: 0 };
  }
  const response = await messaging.sendEachForMulticast({
    tokens,
    notification: { title: payload.title, body: payload.body },
    data: payload.data ?? {},
  });
  const status: PushResult["status"] = response.failureCount === 0
    ? "sent"
    : response.successCount === 0 ? "failed" : "partial";
  return {
    status,
    successCount: response.successCount,
    failureCount: response.failureCount,
    attempted,
  };
}

export async function sendPushToAudience(audience: string[], payload: PushPayload): Promise<PushResult> {
  const tokens = await resolveDeviceTokens(audience);
  return sendPushToTokens(tokens, payload);
}

async function resolveDeviceTokens(audience: string[]): Promise<string[]> {
  const normalized = audience.map(item => item.trim()).filter(Boolean);
  if (normalized.length === 0 || normalized.includes("all")) {
    const snapshot = await db.collection("devices").get();
    return uniqueTokens(snapshot.docs.map(doc => doc.get("token") as string));
  }
  const roles: string[] = [];
  const classIds: string[] = [];
  for (const item of normalized) {
    if (item === "staff") {
      roles.push("staff");
    } else if (item === "parents" || item === "parent") {
      roles.push("parent");
    } else if (item !== "class") {
      classIds.push(item);
    }
  }
  const tokens: string[] = [];
  for (let i = 0; i < roles.length; i += IN_CLAUSE_LIMIT) {
    const batch = roles.slice(i, i + IN_CLAUSE_LIMIT);
    const snapshot = await db.collection("devices").where("role", "in", batch).get();
    tokens.push(...snapshot.docs.map(doc => doc.get("token") as string));
  }
  if (classIds.length > 0) {
    const parentIds = await resolveParentIdsForClasses(classIds);
    for (let i = 0; i < parentIds.length; i += IN_CLAUSE_LIMIT) {
      const batch = parentIds.slice(i, i + IN_CLAUSE_LIMIT);
      const snapshot = await db.collection("devices").where("userId", "in", batch).get();
      tokens.push(...snapshot.docs.map(doc => doc.get("token") as string));
    }
  }
  return uniqueTokens(tokens);
}

async function resolveParentIdsForClasses(classIds: string[]): Promise<string[]> {
  const parentIds = new Set<string>();
  for (let i = 0; i < classIds.length; i += IN_CLAUSE_LIMIT) {
    const batch = classIds.slice(i, i + IN_CLAUSE_LIMIT);
    const snapshot = await db.collection("students").where("classSectionId", "in", batch).get();
    for (const doc of snapshot.docs) {
      const ids = doc.get("parentIds");
      if (Array.isArray(ids)) {
        for (const id of ids) if (typeof id === "string") parentIds.add(id);
      }
    }
  }
  return Array.from(parentIds);
}

function uniqueTokens(tokens: (string | undefined | null)[]): string[] {
  const seen = new Set<string>();
  for (const token of tokens) {
    if (token && !seen.has(token)) seen.add(token);
  }
  return Array.from(seen);
}
