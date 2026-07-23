import { db } from "../config/firebase";
import { env } from "../config/env";
import { User, UserRole } from "../types";
import { findAll, findById, fromDocument, toDocument, update } from "./firestore.repository";
import { provisionUser } from "../services/credential.service";
import { registerSeedUser } from "../seed-context";
import { logger } from "../config/logger";

export type UserRow = User;

const COLLECTION = "users";

class UserRepository {
  async seed() {
    const existing = await db.collection(COLLECTION).limit(1).get();
    if (!existing.empty) return;
    const seeds = [
      { id: "u-admin", firstName: "Admin", lastName: "User", name: "Admin User", email: env.ADMIN_EMAIL, role: UserRole.Admin },
      { id: "u-parent-1", firstName: "Priya", lastName: "Sharma", name: "Priya Sharma", email: "parent@school.local", role: UserRole.Parent },
      { id: "u-parent-2", firstName: "Rohan", lastName: "Mehta", name: "Rohan Mehta", email: "rohan@school.local", role: UserRole.Parent },
      { id: "u-teacher-1", firstName: "Anita", lastName: "Verma", name: "Anita Verma", email: "staff@school.local", role: UserRole.Staff },
      { id: "u-teacher-2", firstName: "Karthik", lastName: "Iyer", name: "Karthik Iyer", email: "karthik.i@school.local", role: UserRole.Staff },
    ];
    const now = new Date();
    for (const seed of seeds) {
      const password = env.ADMIN_PASSWORD;
      const username = `${seed.firstName.toLowerCase()}.${seed.lastName.toLowerCase()}`.replace(/[^a-z.]/g, "");
      const { uid } = await provisionUser({ email: seed.email, displayName: seed.name, password });
      const row: UserRow = {
        id: uid,
        name: seed.name,
        email: this.normalizeEmail(seed.email),
        role: seed.role,
        status: "active",
        firstName: seed.firstName,
        lastName: seed.lastName,
        username,
        subjectIds: [],
        isClassTeacher: false,
        createdAt: now,
        updatedAt: now,
      };
      await db.collection(COLLECTION).doc(uid).set(toDocument(row));
      registerSeedUser(seed.id, uid);
      logger.info({ email: row.email, role: seed.role }, "Seeded Firebase Auth user — credentials logged below");
      logger.info({ email: row.email, password }, "PROVISIONED CREDENTIALS (dev seed)");
    }
  }

  async findByEmail(email: string): Promise<UserRow | undefined> {
    const snapshot = await db.collection(COLLECTION).where("email", "==", this.normalizeEmail(email)).limit(1).get();
    return snapshot.empty ? undefined : fromDocument<UserRow>(snapshot.docs[0]);
  }

  async findByUsername(username: string): Promise<UserRow | undefined> {
    const snapshot = await db.collection(COLLECTION).where("username", "==", username.trim().toLowerCase()).limit(1).get();
    return snapshot.empty ? undefined : fromDocument<UserRow>(snapshot.docs[0]);
  }

  findById(id: string) { return findById<UserRow>(COLLECTION, id); }

  findAll(filter?: { role?: UserRole; status?: string }) {
    const filters = [];
    if (filter?.role) filters.push({ field: "role", value: filter.role });
    if (filter?.status) filters.push({ field: "status", value: filter.status });
    return findAll<UserRow>(COLLECTION, filters);
  }

  async createWithId(id: string, data: Omit<UserRow, "id" | "createdAt" | "updatedAt">): Promise<UserRow> {
    const now = new Date();
    const row: UserRow = { ...data, email: this.normalizeEmail(data.email), id, createdAt: now, updatedAt: now };
    await db.collection(COLLECTION).doc(id).set(toDocument(row));
    return row;
  }

  async createWithFirstUserCheck(id: string, data: Omit<UserRow, "id" | "createdAt" | "updatedAt" | "role">): Promise<UserRow> {
    const now = new Date();
    return db.runTransaction(async (tx) => {
      const snapshot = await tx.get(db.collection(COLLECTION).limit(1));
      const role = snapshot.empty ? UserRole.Admin : UserRole.Parent;
      const row: UserRow = { ...data, email: this.normalizeEmail(data.email), role, id, createdAt: now, updatedAt: now };
      tx.set(db.collection(COLLECTION).doc(id), toDocument(row));
      return row;
    });
  }

  update(id: string, data: Partial<UserRow>) {
    return update<UserRow>(COLLECTION, id, data.email ? { ...data, email: this.normalizeEmail(data.email) } : data);
  }

  async delete(id: string): Promise<boolean> {
    return Boolean(await this.update(id, { status: "inactive" }));
  }

  private normalizeEmail(email: string) { return email.trim().toLowerCase(); }
}

export const userRepository = new UserRepository();
