import { createHash } from "crypto";
import { db } from "../config/firebase";
import { ExamSchedule, Grade } from "../types";
import { create, findAll, findById, fromDocument, remove, seedCollection, toDocument, update } from "./firestore.repository";

const EXAMS = "examSchedules";
const GRADES = "grades";
const gradeId = (student: string, exam: string, subject: string) => createHash("sha256").update(`${student}:${exam}:${subject}`).digest("hex");

class ExamRepository {
  async seed() {
    const today = new Date();
    const now = new Date();
    const date = (days: number) => new Date(today.getTime() + days * 86400000).toISOString().slice(0, 10);
    await seedCollection<ExamSchedule>(EXAMS, [
      { id: "exam-1", subjectId: "sub-math", classSectionId: "cs-5a", title: "Unit Test 2", date: date(4), maxMarks: 50, createdAt: now, updatedAt: now },
      { id: "exam-2", subjectId: "sub-eng", classSectionId: "cs-5a", title: "Unit Test 2", date: date(6), maxMarks: 50, createdAt: now, updatedAt: now },
      { id: "exam-3", subjectId: "sub-sci", classSectionId: "cs-7b", title: "Mid Term", date: date(8), maxMarks: 80, createdAt: now, updatedAt: now },
    ]);
  }

  findAllExams(filter?: { classSectionId?: string }) { return findAll<ExamSchedule>(EXAMS, filter?.classSectionId ? [{ field: "classSectionId", value: filter.classSectionId }] : []); }
  findExamById(id: string) { return findById<ExamSchedule>(EXAMS, id); }
  createExam(data: Omit<ExamSchedule, "id" | "createdAt" | "updatedAt">) { return create<ExamSchedule>(EXAMS, data); }
  updateExam(id: string, data: Partial<ExamSchedule>) { return update<ExamSchedule>(EXAMS, id, data); }
  deleteExam(id: string) { return remove(EXAMS, id); }
  findAllGrades(filter?: { studentId?: string; examScheduleId?: string }) {
    const filters = [];
    if (filter?.studentId) filters.push({ field: "studentId", value: filter.studentId });
    if (filter?.examScheduleId) filters.push({ field: "examScheduleId", value: filter.examScheduleId });
    return findAll<Grade>(GRADES, filters);
  }

  async createGrade(data: Omit<Grade, "id" | "createdAt" | "updatedAt">): Promise<Grade> {
    const id = gradeId(data.studentId, data.examScheduleId, data.subjectId);
    const ref = db.collection(GRADES).doc(id);
    return db.runTransaction(async transaction => {
      const snapshot = await transaction.get(ref);
      const now = new Date();
      const grade: Grade = snapshot.exists
        ? { ...fromDocument<Grade>(snapshot), ...data, id, updatedAt: now }
        : { ...data, id, createdAt: now, updatedAt: now };
      transaction.set(ref, toDocument(grade));
      return grade;
    });
  }

  findExistingGrade(studentId: string, examScheduleId: string, subjectId: string) { return findById<Grade>(GRADES, gradeId(studentId, examScheduleId, subjectId)); }
}

export const examRepository = new ExamRepository();
