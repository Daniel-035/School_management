import { Gender } from "../types";
import { studentRepository } from "../repositories/student.repository";
import { classRepository } from "../repositories/class.repository";
import { NotFoundError } from "../utils/errors";

export async function listStudents(filter?: { classSectionId?: string; parentId?: string }) {
  return studentRepository.findAll(filter);
}

export async function getStudent(id: string) {
  const student = await studentRepository.findById(id);
  if (!student) throw new NotFoundError("Student");
  return student;
}

export async function createStudent(data: {
  firstName: string;
  lastName: string;
  rollNumber?: string;
  classSectionId: string;
  parentIds: string[];
  phone?: string;
  address?: string;
  dateOfBirth?: string;
  gender?: Gender;
  profilePicturePath?: string;
}) {
  const name = `${data.firstName} ${data.lastName}`.trim();
  return studentRepository.create({
    name,
    firstName: data.firstName,
    lastName: data.lastName,
    rollNumber: data.rollNumber,
    classSectionId: data.classSectionId,
    parentIds: data.parentIds,
    phone: data.phone,
    address: data.address,
    dateOfBirth: data.dateOfBirth,
    gender: data.gender,
    profilePicturePath: data.profilePicturePath,
    status: "active",
  });
}

export async function updateStudent(id: string, data: Partial<{
  firstName: string;
  lastName: string;
  name: string;
  rollNumber?: string;
  classSectionId: string;
  parentIds: string[];
  phone?: string;
  address?: string;
  dateOfBirth?: string;
  gender?: Gender;
  profilePicturePath?: string;
  status: "active" | "inactive";
}>) {
  if (data.firstName || data.lastName) {
    if (!data.firstName || !data.lastName) {
      const existing = await studentRepository.findById(id);
      if (existing) {
        const fn = data.firstName ?? existing.firstName ?? "";
        const ln = data.lastName ?? existing.lastName ?? "";
        data.name = `${fn} ${ln}`.trim();
      }
    } else {
      data.name = `${data.firstName} ${data.lastName}`.trim();
    }
  }
  const student = await studentRepository.update(id, data);
  if (!student) throw new NotFoundError("Student");
  return student;
}

export async function deleteStudent(id: string) {
  const removed = await studentRepository.delete(id);
  if (!removed) throw new NotFoundError("Student");
}

export async function listClasses() {
  return classRepository.findAllClasses();
}

export async function getClass(id: string) {
  const cls = await classRepository.findClassById(id);
  if (!cls) throw new NotFoundError("Class");
  return cls;
}

export async function createClass(data: { grade: string; section: string; name: string; classTeacherId?: string; subjectIds: string[] }) {
  return classRepository.createClass(data);
}

export async function updateClass(id: string, data: Partial<{ grade: string; section: string; name: string; classTeacherId?: string; subjectIds: string[] }>) {
  const cls = await classRepository.updateClass(id, data);
  if (!cls) throw new NotFoundError("Class");
  return cls;
}

export async function deleteClass(id: string) {
  const removed = await classRepository.deleteClass(id);
  if (!removed) throw new NotFoundError("Class");
}

export async function listSubjects() {
  return classRepository.findAllSubjects();
}

export async function createSubject(data: { name: string; code: string }) {
  return classRepository.createSubject(data);
}
