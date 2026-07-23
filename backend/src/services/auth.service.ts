import { env } from "../config/env";
import { userRepository, UserRow } from "../repositories/user.repository";
import { UnauthorizedError, NotFoundError, ConflictError, AppError } from "../utils/errors";
import { revokeRefreshTokens, deleteFirebaseUser } from "./credential.service";

interface FirebaseAuthResponse {
  idToken: string;
  refreshToken: string;
  localId: string;
  expiresIn?: string;
}

interface TokenRefreshResponse {
  access_token: string;
  refresh_token: string;
  user_id: string;
  expires_in?: string;
}

interface FirebaseRestError {
  error?: { message?: string };
}

const IDENTITY_TOOLKIT_URL = "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword";
const SIGNUP_URL = "https://identitytoolkit.googleapis.com/v1/accounts:signUp";
const OOB_URL = "https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode";
const RESET_URL = "https://identitytoolkit.googleapis.com/v1/accounts:resetPassword";
const SECURE_TOKEN_URL = "https://securetoken.googleapis.com/v1/token";

function sanitizeUser(row: UserRow): UserRow {
  return row;
}

async function loadActiveUser(uid: string, identifier?: string): Promise<UserRow> {
  let user = await userRepository.findById(uid);
  if (!user && identifier) {
    const norm = identifier.trim().toLowerCase();
    user = await userRepository.findByEmail(norm);
    if (!user && !norm.includes("@")) {
      user = await userRepository.findByUsername(norm);
    }
    if (!user) {
      const { studentRepository } = await import("../repositories/student.repository");
      const { UserRole } = await import("../types");
      let student = await studentRepository.findByEmail(norm);
      if (!student && !norm.includes("@")) {
        student = await studentRepository.findByUsername(norm);
      }
      if (student) {
        user = await userRepository.createWithId(uid, {
          name: student.name,
          email: student.email ?? `${student.username ?? "student"}@student.school.internal`,
          role: UserRole.Student,
          status: student.status ?? "active",
          firstName: student.firstName ?? student.name.split(" ")[0],
          lastName: student.lastName ?? student.name.split(" ").slice(1).join(" "),
          username: student.username ?? student.name.toLowerCase().replace(/[^a-z.]/g, ""),
          subjectIds: [],
          isClassTeacher: false,
        });
      }
    }
  }
  if (!user) throw new UnauthorizedError("Account is not provisioned in this application");
  if (user.status !== "active") throw new UnauthorizedError("Account is inactive");
  return user;
}

function tokenResult(user: UserRow, token: string, refreshToken: string) {
  return { token, accessToken: token, refreshToken, user: sanitizeUser(user) };
}

async function signInWithPassword(email: string, password: string): Promise<FirebaseAuthResponse> {
  const response = await fetch(`${IDENTITY_TOOLKIT_URL}?key=${env.FIREBASE_WEB_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as FirebaseRestError | null;
    const message = body?.error?.message ?? "Invalid email or password";
    if (message.includes("EMAIL_NOT_FOUND") || message.includes("INVALID_PASSWORD") || message.includes("USER_DISABLED")) {
      throw new UnauthorizedError("Invalid email or password");
    }
    throw new UnauthorizedError("Authentication failed");
  }
  return (await response.json()) as FirebaseAuthResponse;
}

async function refreshWithSecureToken(refreshToken: string): Promise<TokenRefreshResponse> {
  const response = await fetch(`${SECURE_TOKEN_URL}?key=${env.FIREBASE_WEB_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grantType: "refresh_token", refreshToken }),
  });
  if (!response.ok) {
    throw new UnauthorizedError("Invalid refresh token");
  }
  return (await response.json()) as TokenRefreshResponse;
}

export async function login(identifier: string, password: string) {
  let email = identifier.trim();
  if (!email.includes("@")) {
    const userByUsername = await userRepository.findByUsername(email);
    if (userByUsername) {
      email = userByUsername.email;
    } else {
      const { studentRepository } = await import("../repositories/student.repository");
      const studentByUsername = await studentRepository.findByUsername(email);
      if (studentByUsername && studentByUsername.email) {
        email = studentByUsername.email;
      } else {
        email = `${email.toLowerCase()}@student.school.internal`;
      }
    }
  }

  const session = await signInWithPassword(email, password);
  const user = await loadActiveUser(session.localId, identifier);
  return tokenResult(user, session.idToken, session.refreshToken);
}

export async function refresh(refreshToken: string) {
  const refreshed = await refreshWithSecureToken(refreshToken);
  const user = await loadActiveUser(refreshed.user_id);
  return tokenResult(user, refreshed.access_token, refreshed.refresh_token);
}

export async function me(userId: string): Promise<UserRow> {
  const user = await userRepository.findById(userId);
  if (!user) throw new NotFoundError("User");
  if (user.status !== "active") throw new UnauthorizedError("Account is inactive");
  return sanitizeUser(user);
}

export async function logout(_refreshToken: string) {
  // Firebase refresh tokens are invalidated client-side on sign-out. A single-device
  // logout cannot revoke one Firebase token in isolation; use /auth/logout-all to
  // revoke all sessions for a user.
}

export async function logoutAll(userId: string) {
  const user = await userRepository.findById(userId);
  if (!user) throw new NotFoundError("User");
  await revokeRefreshTokens(userId);
}

interface FirebaseSignupResponse {
  idToken: string;
  refreshToken: string;
  localId: string;
}

export async function register(data: { firstName: string; lastName: string; email: string; password: string }) {
  const existing = await userRepository.findByEmail(data.email);
  if (existing) throw new ConflictError("An account with this email already exists");

  const response = await fetch(`${SIGNUP_URL}?key=${env.FIREBASE_WEB_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: data.email, password: data.password, returnSecureToken: true }),
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as FirebaseRestError | null;
    const message = body?.error?.message ?? "Registration failed";
    if (message.includes("EMAIL_EXISTS")) throw new ConflictError("An account with this email already exists");
    throw new AppError(`Registration failed: ${message}`, 502, "AUTH_REGISTRATION_FAILED");
  }
  const session = (await response.json()) as FirebaseSignupResponse;

  const name = `${data.firstName} ${data.lastName}`;

  let row: UserRow;
  try {
    row = await userRepository.createWithFirstUserCheck(session.localId, {
      name,
      email: data.email.toLowerCase(),
      status: "active",
      firstName: data.firstName,
      lastName: data.lastName,
      username: `${data.firstName.toLowerCase()}.${data.lastName.toLowerCase()}`.replace(/[^a-z.]/g, ""),
      subjectIds: [],
      isClassTeacher: false,
    });
  } catch (error) {
    await deleteFirebaseUser(session.localId).catch(() => {});
    throw error;
  }

  return tokenResult(row, session.idToken, session.refreshToken);
}

export async function forgotPassword(email: string) {
  const user = await userRepository.findByEmail(email);
  if (!user) return;

  await fetch(`${OOB_URL}?key=${env.FIREBASE_WEB_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ requestType: "PASSWORD_RESET", email }),
  });
}

export async function resetPassword(oobCode: string, newPassword: string) {
  const response = await fetch(`${RESET_URL}?key=${env.FIREBASE_WEB_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ oobCode, newPassword }),
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as FirebaseRestError | null;
    const message = body?.error?.message ?? "Password reset failed";
    if (message.includes("INVALID_OOB_CODE") || message.includes("EXPIRED_OOB_CODE")) {
      throw new AppError("The reset link is invalid or has expired", 400, "INVALID_RESET_CODE");
    }
    throw new AppError(`Password reset failed: ${message}`, 502, "AUTH_RESET_FAILED");
  }
}
