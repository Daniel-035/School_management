import { UserRole } from "../types";
import type { Gender } from "../types";
import { userRepository, UserRow } from "../repositories/user.repository";
import { ConflictError, NotFoundError } from "../utils/errors";
import { generatePassword, generateUsername, provisionUser, updateFirebaseUser, disableFirebaseUser } from "./credential.service";
import { sendCredentialsEmail } from "./email.service";

export interface CreatedUser {
  user: UserRow;
  username: string;
  provisionalPassword?: string;
  emailSent: boolean;
}

export async function listUsers(filter?: { role?: UserRole; status?: string }) {
  return userRepository.findAll(filter);
}

export async function getUser(id: string) {
  const user = await userRepository.findById(id);
  if (!user) throw new NotFoundError("User");
  return user;
}

export async function createUser(data: {
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  status: "active" | "inactive";
  phone?: string;
  address?: string;
  dateOfBirth?: string;
  gender?: Gender;
  profilePicturePath?: string;
  department?: string;
  subjectIds?: string[];
  isClassTeacher?: boolean;
  classTeacherForId?: string;
}): Promise<CreatedUser> {
  if (await userRepository.findByEmail(data.email)) throw new ConflictError("Email already exists");
  const name = `${data.firstName} ${data.lastName}`.trim();
  const username = generateUsername(data.firstName, data.lastName);
  const password = generatePassword();
  const { uid } = await provisionUser({ email: data.email, displayName: name, password });
  const user = await userRepository.createWithId(uid, {
    name,
    email: data.email,
    role: data.role,
    status: data.status,
    firstName: data.firstName,
    lastName: data.lastName,
    username,
    phone: data.phone,
    address: data.address,
    dateOfBirth: data.dateOfBirth,
    gender: data.gender,
    profilePicturePath: data.profilePicturePath,
    department: data.department,
    subjectIds: data.subjectIds ?? [],
    isClassTeacher: data.isClassTeacher ?? false,
    classTeacherForId: data.classTeacherForId,
  });
  const emailSent = await sendCredentialsEmail({ to: user.email, name: user.name, username, password });
  return { user, username, provisionalPassword: emailSent ? undefined : password, emailSent };
}

export async function updateUser(id: string, data: Partial<{
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  role: UserRole;
  status: "active" | "inactive";
  phone: string;
  address: string;
  dateOfBirth: string;
  gender: Gender;
  profilePicturePath: string;
  department: string;
  subjectIds: string[];
  isClassTeacher: boolean;
  classTeacherForId: string;
}>) {
  if (data.email) {
    const other = await userRepository.findByEmail(data.email);
    if (other && other.id !== id) throw new ConflictError("Email already exists");
  }
  if (data.firstName || data.lastName) {
    const existing = await userRepository.findById(id);
    if (existing) {
      const fn = data.firstName ?? existing.firstName ?? "";
      const ln = data.lastName ?? existing.lastName ?? "";
      data.name = `${fn} ${ln}`.trim();
    }
  }
  const firebaseUpdate: { email?: string; displayName?: string } = {};
  if (data.email) firebaseUpdate.email = data.email;
  if (data.name) firebaseUpdate.displayName = data.name;
  if (Object.keys(firebaseUpdate).length > 0) {
    try { await updateFirebaseUser(id, firebaseUpdate); } catch { /* best-effort sync; Firestore is source of truth for app data */ }
  }
  const user = await userRepository.update(id, data);
  if (!user) throw new NotFoundError("User");
  return user;
}

export async function deleteUser(id: string) {
  if (!await userRepository.delete(id)) throw new NotFoundError("User");
  try { await disableFirebaseUser(id); } catch { /* best-effort; Firestore soft-delete already applied */ }
}
