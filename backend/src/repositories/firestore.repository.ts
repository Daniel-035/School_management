import {
  CollectionReference,
  DocumentData,
  DocumentSnapshot,
  Query,
  Timestamp,
} from "firebase-admin/firestore";
import { db } from "../config/firebase";

type Entity = { id: string };
type Filter = { field: string; value: unknown; operator?: "==" | "array-contains" };

function normalize(value: unknown): unknown {
  if (value instanceof Timestamp) return value.toDate();
  if (Array.isArray(value)) return value.map(normalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, normalize(item)]));
  }
  return value;
}

export function fromDocument<T extends Entity>(snapshot: DocumentSnapshot): T {
  return { id: snapshot.id, ...(normalize(snapshot.data()) as object) } as T;
}

export function toDocument(value: object): DocumentData {
  return Object.fromEntries(
    Object.entries(value).filter(([key, item]) => key !== "id" && item !== undefined)
  );
}

export function collection(name: string): CollectionReference {
  return db.collection(name);
}

export async function seedCollection<T extends Entity>(name: string, values: T[]): Promise<void> {
  const ref = collection(name);
  const existing = await ref.limit(1).get();
  if (!existing.empty) return;

  const batch = db.batch();
  for (const value of values) batch.set(ref.doc(value.id), toDocument(value));
  await batch.commit();
}

export async function findAll<T extends Entity>(name: string, filters: Filter[] = []): Promise<T[]> {
  const ref = collection(name);
  let query: Query = ref;
  if (filters.length > 0) {
    const first = filters[0];
    query = query.where(first.field, first.operator ?? "==", first.value);
  }
  const snapshot = await query.get();
  let values = snapshot.docs.map(doc => fromDocument<T>(doc));

  for (const filter of filters.slice(1)) {
    values = values.filter(value => {
      const item = (value as unknown as Record<string, unknown>)[filter.field];
      return filter.operator === "array-contains"
        ? Array.isArray(item) && item.includes(filter.value)
        : item === filter.value;
    });
  }
  return values;
}

export async function findById<T extends Entity>(name: string, id: string): Promise<T | undefined> {
  const snapshot = await collection(name).doc(id).get();
  return snapshot.exists ? fromDocument<T>(snapshot) : undefined;
}

export async function create<T extends Entity>(
  name: string,
  data: Omit<T, "id" | "createdAt" | "updatedAt">
): Promise<T> {
  const ref = collection(name).doc();
  const now = new Date();
  const value = { ...data, id: ref.id, createdAt: now, updatedAt: now } as unknown as T;
  await ref.set(toDocument(value as unknown as Record<string, unknown>));
  return value;
}

export async function update<T extends Entity>(name: string, id: string, data: Partial<T>): Promise<T | undefined> {
  const ref = collection(name).doc(id);
  return db.runTransaction(async transaction => {
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists) return undefined;
    const existing = fromDocument<T>(snapshot);
    const { id: _id, createdAt: _createdAt, ...allowed } = data as Partial<T> & {
      createdAt?: unknown;
    };
    const value = { ...existing, ...allowed, id, createdAt: (existing as Record<string, unknown>).createdAt, updatedAt: new Date() } as T;
    transaction.set(ref, toDocument(value as unknown as Record<string, unknown>));
    return value;
  });
}

export async function remove(name: string, id: string): Promise<boolean> {
  const ref = collection(name).doc(id);
  return db.runTransaction(async transaction => {
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists) return false;
    transaction.delete(ref);
    return true;
  });
}
