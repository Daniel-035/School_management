import { communicationRepository } from "../repositories/communication.repository";
import { NotFoundError } from "../utils/errors";

export async function listThreads(filter?: { parentId?: string; teacherId?: string }) {
  return communicationRepository.findAllThreads(filter);
}

export async function getThread(id: string) {
  const thread = await communicationRepository.findThreadById(id);
  if (!thread) throw new NotFoundError("Thread");
  return thread;
}

export async function createThread(data: { parentId: string; teacherId: string; teacherName: string; teacherSubject: string; studentId: string }) {
  return communicationRepository.createThread({ ...data, unreadCount: 0 });
}

export async function listMessages(threadId: string) {
  return communicationRepository.findMessagesByThread(threadId);
}

export async function sendMessage(data: { threadId: string; senderId: string; text: string }) {
  const thread = await communicationRepository.findThreadById(data.threadId);
  if (!thread) throw new NotFoundError("Thread");
  return communicationRepository.createMessage({
    ...data,
    sentAt: new Date().toISOString(),
  });
}
