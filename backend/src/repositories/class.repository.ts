import { ClassSection, Subject } from "../types";
import { create, findAll, findById, remove, seedCollection, update } from "./firestore.repository";

const CLASS_COLLECTION = "classSections";
const SUBJECT_COLLECTION = "subjects";

class ClassRepository {
  async seed() {
    const now = new Date();
    const subjects: Subject[] = [
      { id: "sub-eng", name: "English", code: "ENG", createdAt: now, updatedAt: now },
      { id: "sub-math", name: "Mathematics", code: "MATH", createdAt: now, updatedAt: now },
      { id: "sub-sci", name: "Science", code: "SCI", createdAt: now, updatedAt: now },
      { id: "sub-sst", name: "Social Studies", code: "SST", createdAt: now, updatedAt: now },
      { id: "sub-hin", name: "Hindi", code: "HIN", createdAt: now, updatedAt: now },
    ];
    await seedCollection<Subject>(SUBJECT_COLLECTION, subjects);
    const subjectIds = subjects.map(subject => subject.id);
    const standardGrades = [
      { id: "cs-nursery", grade: "Nursery", section: "A", name: "Nursery" },
      { id: "cs-lkg", grade: "L.KG", section: "A", name: "L.KG" },
      { id: "cs-ukg", grade: "U.KG", section: "A", name: "U.KG" },
      ...Array.from({ length: 12 }, (_, i) => {
        const grade = String(i + 1);
        return { id: `cs-${grade}a`, grade, section: "A", name: `Class ${grade}` };
      }),
    ];
    await seedCollection<ClassSection>(CLASS_COLLECTION, standardGrades.map(c => ({
      ...c,
      subjectIds,
      createdAt: now,
      updatedAt: now,
    })));
  }

  findAllClasses() { return findAll<ClassSection>(CLASS_COLLECTION); }
  findClassById(id: string) { return findById<ClassSection>(CLASS_COLLECTION, id); }
  createClass(data: Omit<ClassSection, "id" | "createdAt" | "updatedAt">) { return create<ClassSection>(CLASS_COLLECTION, data); }
  updateClass(id: string, data: Partial<ClassSection>) { return update<ClassSection>(CLASS_COLLECTION, id, data); }
  deleteClass(id: string) { return remove(CLASS_COLLECTION, id); }
  findAllSubjects() { return findAll<Subject>(SUBJECT_COLLECTION); }
  findSubjectById(id: string) { return findById<Subject>(SUBJECT_COLLECTION, id); }
  createSubject(data: Omit<Subject, "id" | "createdAt" | "updatedAt">) { return create<Subject>(SUBJECT_COLLECTION, data); }
}

export const classRepository = new ClassRepository();
