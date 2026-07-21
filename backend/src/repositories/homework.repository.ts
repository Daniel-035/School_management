import { Homework } from "../types";
import { resolveSeedId } from "../seed-context";
import { create, findAll, findById, remove, seedCollection, update } from "./firestore.repository";

const COLLECTION = "homework";

class HomeworkRepository {
  async seed() {
    const today = new Date();
    const now = new Date();
    const date = (days: number) => new Date(today.getTime() + days * 86400000).toISOString().slice(0, 10);
    const t1 = resolveSeedId("u-teacher-1");
    const t2 = resolveSeedId("u-teacher-2");
    await seedCollection<Homework>(COLLECTION, [
      { id: "hw-1", title: "Reading: Chapter 4 - The Wright Brothers", description: "Read the chapter and answer the 5 questions at the end in your English notebook.", subjectId: "sub-eng", classSectionId: "cs-5a", dueDate: date(1), attachments: [], createdBy: t1, createdAt: now, updatedAt: now },
      { id: "hw-2", title: "Maths Worksheet: Fractions (set 3)", description: "Complete Q1-Q10. Show all working.", subjectId: "sub-math", classSectionId: "cs-5a", dueDate: date(0), attachments: [], createdBy: t1, createdAt: now, updatedAt: now },
      { id: "hw-3", title: "Science - States of Matter diagram", description: "Draw and label the three states with two examples each.", subjectId: "sub-sci", classSectionId: "cs-7b", dueDate: date(3), attachments: [], createdBy: t2, createdAt: now, updatedAt: now },
      { id: "hw-4", title: "Hindi - Write a paragraph on 'Mera Parivar'", description: "10-12 lines, neat handwriting.", subjectId: "sub-hin", classSectionId: "cs-5a", dueDate: date(2), attachments: [], createdBy: t1, createdAt: now, updatedAt: now },
    ]);
  }

  findAll(filter?: { classSectionId?: string; studentId?: string }) {
    return findAll<Homework>(COLLECTION, filter?.classSectionId ? [{ field: "classSectionId", value: filter.classSectionId }] : []);
  }
  findById(id: string) { return findById<Homework>(COLLECTION, id); }
  create(data: Omit<Homework, "id" | "createdAt" | "updatedAt">) { return create<Homework>(COLLECTION, data); }
  update(id: string, data: Partial<Homework>) { return update<Homework>(COLLECTION, id, data); }
  delete(id: string) { return remove(COLLECTION, id); }
}

export const homeworkRepository = new HomeworkRepository();
