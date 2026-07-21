import { examRepository } from "../repositories/exam.repository";
import { NotFoundError } from "../utils/errors";

export async function listExams(filter?: { classSectionId?: string }) {
  return examRepository.findAllExams(filter);
}

export async function getExam(id: string) {
  const exam = await examRepository.findExamById(id);
  if (!exam) throw new NotFoundError("Exam");
  return exam;
}

export async function createExam(data: { subjectId: string; classSectionId: string; title: string; date: string; maxMarks: number }) {
  return examRepository.createExam(data);
}

export async function updateExam(id: string, data: Partial<{ subjectId: string; classSectionId: string; title: string; date: string; maxMarks: number }>) {
  const exam = await examRepository.updateExam(id, data);
  if (!exam) throw new NotFoundError("Exam");
  return exam;
}

export async function deleteExam(id: string) {
  const removed = await examRepository.deleteExam(id);
  if (!removed) throw new NotFoundError("Exam");
}

export async function listGrades(filter?: { studentId?: string; examScheduleId?: string }) {
  return examRepository.findAllGrades(filter);
}

export async function createGrade(data: { studentId: string; examScheduleId: string; subjectId: string; marks: number; remarks?: string }) {
  return examRepository.createGrade(data);
}

export async function getStudentReport(studentId: string) {
  const grades = await examRepository.findAllGrades({ studentId });
  return { studentId, grades };
}

export async function getClassPerformance(classSectionId: string) {
  return examRepository.findAllGrades({});
}
