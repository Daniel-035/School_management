import { Student } from "../types";
import { resolveSeedId } from "../seed-context";
import { create, findAll, findById, remove, seedCollection, update } from "./firestore.repository";

const COLLECTION = "students";

class StudentRepository {
  async seed() {
    const now = new Date();
    const p1 = resolveSeedId("u-parent-1");
    const p2 = resolveSeedId("u-parent-2");
    await seedCollection<Student>(COLLECTION, [
      { id: "stu-1", name: "Aarav Sharma", rollNumber: "12", classSectionId: "cs-5a", parentIds: [p1], status: "active", createdAt: now, updatedAt: now },
      { id: "stu-2", name: "Ananya Sharma", rollNumber: "04", classSectionId: "cs-7b", parentIds: [p1], status: "active", createdAt: now, updatedAt: now },
      { id: "stu-3", name: "Ishaan Mehta", rollNumber: "21", classSectionId: "cs-6b", parentIds: [p2], status: "active", createdAt: now, updatedAt: now },
    ]);
  }

  findAll(filter?: { classSectionId?: string; parentId?: string }): Promise<Student[]> {
    const filters = [];
    if (filter?.classSectionId) filters.push({ field: "classSectionId", value: filter.classSectionId });
    if (filter?.parentId) filters.push({ field: "parentIds", value: filter.parentId, operator: "array-contains" as const });
    return findAll<Student>(COLLECTION, filters);
  }

  findById(id: string) { return findById<Student>(COLLECTION, id); }
  create(data: Omit<Student, "id" | "createdAt" | "updatedAt">) { return create<Student>(COLLECTION, data); }
  update(id: string, data: Partial<Student>) { return update<Student>(COLLECTION, id, data); }
  delete(id: string) { return remove(COLLECTION, id); }
}

export const studentRepository = new StudentRepository();
