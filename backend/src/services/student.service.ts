import { Gender } from "../types";
import { studentRepository } from "../repositories/student.repository";
import { classRepository } from "../repositories/class.repository";
import { NotFoundError } from "../utils/errors";
import { generatePassword, generateUsername, provisionUser } from "./credential.service";

export async function listStudents(filter?: { classSectionId?: string; parentId?: string }) {
  const students = await studentRepository.findAll(filter);
  if (filter?.parentId && students.length === 0) {
    const selfStudent = await getStudent(filter.parentId).catch(() => null);
    if (selfStudent) {
      return [selfStudent];
    }
  }
  return students;
}

export async function getStudent(id: string) {
  let student = await studentRepository.findById(id);
  if (!student) {
    student = await studentRepository.findByEmail(id);
  }
  if (!student) {
    student = await studentRepository.findByUsername(id);
  }
  if (!student) {
    const { userRepository } = await import("../repositories/user.repository");
    const user = await userRepository.findById(id);
    if (user) {
      if (user.email) student = await studentRepository.findByEmail(user.email);
      if (!student && user.username) student = await studentRepository.findByUsername(user.username);
    }
  }
  if (!student) throw new NotFoundError("Student");
  return student;
}

export async function createStudent(data: {
  firstName: string;
  lastName: string;
  rollNumber?: string;
  classSectionId: string;
  parentIds?: string[];
  governmentId?: string;
  email?: string;
  phone?: string;
  address?: string;
  dateOfBirth?: string;
  gender?: Gender;
  fatherName?: string;
  fatherPhone?: string;
  motherName?: string;
  motherPhone?: string;
  profilePicturePath?: string;
}) {
  const name = `${data.firstName} ${data.lastName}`.trim();
  const username = generateUsername(data.firstName, data.lastName);
  const password = generatePassword();
  const studentEmail = data.email && data.email.trim() !== "" ? data.email.trim() : `${username}@student.school.internal`;

  let uid = "";
  try {
    const res = await provisionUser({ email: studentEmail, displayName: name, password });
    uid = res.uid;
  } catch {
    // If provisioning is bypassed or fails, continue saving student profile
  }

  const student = await studentRepository.create({
    name,
    firstName: data.firstName,
    lastName: data.lastName,
    username,
    rollNumber: data.rollNumber,
    classSectionId: data.classSectionId,
    parentIds: uid ? Array.from(new Set([...(data.parentIds ?? []), uid])) : (data.parentIds ?? []),
    governmentId: data.governmentId,
    email: studentEmail,
    phone: data.phone,
    address: data.address,
    dateOfBirth: data.dateOfBirth,
    gender: data.gender,
    fatherName: data.fatherName,
    fatherPhone: data.fatherPhone,
    motherName: data.motherName,
    motherPhone: data.motherPhone,
    profilePicturePath: data.profilePicturePath,
    status: "active",
  });

  if (uid) {
    const { userRepository } = await import("../repositories/user.repository");
    const { UserRole } = await import("../types");
    await userRepository.createWithId(uid, {
      name,
      email: studentEmail,
      role: UserRole.Student,
      status: "active",
      firstName: data.firstName,
      lastName: data.lastName,
      username,
      phone: data.phone,
      governmentId: data.governmentId,
      address: data.address,
      dateOfBirth: data.dateOfBirth,
      gender: data.gender,
      profilePicturePath: data.profilePicturePath,
      subjectIds: [],
      isClassTeacher: false,
    }).catch(() => {});
  }

  return {
    student,
    username,
    provisionalPassword: password,
  };
}

export async function updateStudent(id: string, data: Partial<{
  firstName: string;
  lastName: string;
  name: string;
  rollNumber?: string;
  classSectionId: string;
  parentIds?: string[];
  governmentId?: string;
  email?: string;
  phone?: string;
  address?: string;
  dateOfBirth?: string;
  gender?: Gender;
  fatherName?: string;
  fatherPhone?: string;
  motherName?: string;
  motherPhone?: string;
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
