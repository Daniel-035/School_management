import { db } from "../config/firebase";
import { ChatMessage, MessageThread } from "../types";
import { resolveSeedId } from "../seed-context";
import { create, findAll, findById, seedCollection, toDocument } from "./firestore.repository";

const THREADS = "messageThreads";
const MESSAGES = "chatMessages";

class CommunicationRepository {
  async seed() {
    const now = new Date();
    const p1 = resolveSeedId("u-parent-1");
    const t1 = resolveSeedId("u-teacher-1");
    const t2 = resolveSeedId("u-teacher-2");
    await seedCollection<MessageThread>(THREADS, [
      { id: "thr-1", parentId: p1, teacherId: t1, teacherName: "Anita Verma", teacherSubject: "Class Teacher - Grade 5A", studentId: "stu-1", unreadCount: 1, lastMessagePreview: "Thanks, will check the notebook tomorrow.", lastMessageAt: new Date(now.getTime() - 10800000).toISOString(), createdAt: now, updatedAt: now },
      { id: "thr-2", parentId: p1, teacherId: t2, teacherName: "Karthik Iyer", teacherSubject: "Science - Grade 7B", studentId: "stu-2", unreadCount: 0, lastMessagePreview: "She has been participating well in lab work.", lastMessageAt: new Date(now.getTime() - 86400000).toISOString(), createdAt: now, updatedAt: now },
    ]);
    await seedCollection<ChatMessage>(MESSAGES, [
      { id: "m-1", threadId: "thr-1", senderId: p1, text: "Good morning ma'am. Aarav mentioned he forgot his English notebook.", sentAt: new Date(now.getTime() - 14400000).toISOString(), createdAt: now },
      { id: "m-2", threadId: "thr-1", senderId: t1, text: "Thanks, will check the notebook tomorrow.", sentAt: new Date(now.getTime() - 10800000).toISOString(), createdAt: now },
      { id: "m-3", threadId: "thr-2", senderId: t2, text: "She has been participating well in lab work.", sentAt: new Date(now.getTime() - 86400000).toISOString(), createdAt: now },
    ]);
  }

  async findAllThreads(filter?: { parentId?: string; teacherId?: string }) {
    const filters = [];
    if (filter?.parentId) filters.push({ field: "parentId", value: filter.parentId });
    if (filter?.teacherId) filters.push({ field: "teacherId", value: filter.teacherId });
    return (await findAll<MessageThread>(THREADS, filters)).sort((a, b) => (b.lastMessageAt ?? "").localeCompare(a.lastMessageAt ?? ""));
  }
  findThreadById(id: string) { return findById<MessageThread>(THREADS, id); }
  createThread(data: Omit<MessageThread, "id" | "createdAt" | "updatedAt">) { return create<MessageThread>(THREADS, data); }
  async findMessagesByThread(threadId: string) { return (await findAll<ChatMessage>(MESSAGES, [{ field: "threadId", value: threadId }])).sort((a, b) => a.sentAt.localeCompare(b.sentAt)); }

  async createMessage(data: Omit<ChatMessage, "id" | "createdAt">): Promise<ChatMessage> {
    const messageRef = db.collection(MESSAGES).doc();
    const threadRef = db.collection(THREADS).doc(data.threadId);
    const now = new Date();
    const message: ChatMessage = { ...data, id: messageRef.id, createdAt: now };
    await db.runTransaction(async transaction => {
      const thread = await transaction.get(threadRef);
      transaction.set(messageRef, toDocument(message));
      if (thread.exists) transaction.update(threadRef, { lastMessagePreview: data.text.slice(0, 100), lastMessageAt: data.sentAt, updatedAt: now });
    });
    return message;
  }
}

export const communicationRepository = new CommunicationRepository();
