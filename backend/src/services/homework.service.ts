import { homeworkRepository } from "../repositories/homework.repository";
import { NotFoundError } from "../utils/errors";

export async function listHomework(filter?: { classSectionId?: string; studentId?: string }) {
  return homeworkRepository.findAll(filter);
}

export async function getHomework(id: string) {
  const item = await homeworkRepository.findById(id);
  if (!item) throw new NotFoundError("Homework");
  return item;
}

export async function createHomework(data: { title: string; description: string; subjectId: string; classSectionId: string; dueDate: string; attachments?: string[]; createdBy: string }) {
  return homeworkRepository.create({ ...data, attachments: data.attachments || [] });
}

export async function updateHomework(id: string, data: Partial<{ title: string; description: string; subjectId: string; classSectionId: string; dueDate: string; attachments: string[] }>) {
  const item = await homeworkRepository.update(id, data);
  if (!item) throw new NotFoundError("Homework");
  return item;
}

export async function deleteHomework(id: string) {
  const removed = await homeworkRepository.delete(id);
  if (!removed) throw new NotFoundError("Homework");
}
