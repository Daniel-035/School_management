import { randomBytes } from "crypto";
import { getAuth } from "firebase-admin/auth";
import { ConflictError, AppError } from "../utils/errors";

const PASSWORD_LENGTH = 16;

export function generatePassword(): string {
  return randomBytes(PASSWORD_LENGTH).toString("base64url").slice(0, PASSWORD_LENGTH);
}

export function generateUsername(firstName: string, lastName: string): string {
  const base = `${firstName.toLowerCase().replace(/[^a-z]/g, "")}.${lastName.toLowerCase().replace(/[^a-z]/g, "")}`;
  const suffix = randomBytes(3).toString("hex").slice(0, 4);
  return `${base}${suffix}`;
}

export interface ProvisionedUser {
  uid: string;
  email: string;
}

export async function provisionUser(data: { email: string; displayName: string; password: string }): Promise<ProvisionedUser> {
  try {
    const record = await getAuth().createUser({
      email: data.email,
      password: data.password,
      displayName: data.displayName,
      emailVerified: false,
      disabled: false,
    });
    return { uid: record.uid, email: record.email ?? data.email };
  } catch (error) {
    const code = (error as { code?: string }).code ?? "";
    if (code === "auth/email-already-exists" || code === "auth/uid-already-exists") {
      throw new ConflictError("A Firebase account already exists for this email");
    }
    throw new AppError(`Failed to create Firebase account: ${error instanceof Error ? error.message : "unknown error"}`, 502, "AUTH_PROVISION_FAILED");
  }
}

export async function updateFirebaseUser(uid: string, data: { email?: string; displayName?: string }): Promise<void> {
  await getAuth().updateUser(uid, data);
}

export async function disableFirebaseUser(uid: string): Promise<void> {
  await getAuth().updateUser(uid, { disabled: true });
}

export async function deleteFirebaseUser(uid: string): Promise<void> {
  await getAuth().deleteUser(uid);
}

export async function revokeRefreshTokens(uid: string): Promise<void> {
  await getAuth().revokeRefreshTokens(uid);
}

export async function verifyIdToken(idToken: string) {
  return getAuth().verifyIdToken(idToken, false);
}
