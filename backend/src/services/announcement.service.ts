import { announcementRepository } from "../repositories/announcement.repository";
import { NotFoundError } from "../utils/errors";
import { sendPushToAudience } from "./notification.service";

export async function listAnnouncements() {
  return announcementRepository.findAll();
}

export async function getAnnouncement(id: string) {
  const item = await announcementRepository.findById(id);
  if (!item) throw new NotFoundError("Announcement");
  return item;
}

export async function createAnnouncement(data: { title: string; body: string; authorId: string; authorName: string; channels: string[]; audience: string[]; pinned?: boolean }) {
  return announcementRepository.create({
    ...data,
    pinned: data.pinned ?? false,
    publishedAt: new Date().toISOString(),
  });
}

export async function updateAnnouncement(id: string, data: Partial<{ title: string; body: string; channels: string[]; audience: string[]; pinned: boolean }>) {
  const item = await announcementRepository.update(id, data);
  if (!item) throw new NotFoundError("Announcement");
  return item;
}

export async function deleteAnnouncement(id: string) {
  const removed = await announcementRepository.delete(id);
  if (!removed) throw new NotFoundError("Announcement");
}

export async function sendAnnouncement(id: string, options: { channels?: ("push" | "email" | "sms")[]; audience?: string[] }) {
  const item = await getAnnouncement(id);
  const channels = options.channels ?? item.channels;
  const audience = options.audience ?? item.audience;
  const results: Record<string, { status: "sent" | "partial" | "failed" | "unsupported"; successCount?: number; failureCount?: number; attempted?: number }> = {};
  for (const channel of channels) {
    if (channel === "push") {
      const delivery = await sendPushToAudience(audience, {
        title: item.title,
        body: item.body,
        data: { announcementId: item.id },
      });
      results["push"] = {
        status: delivery.status,
        successCount: delivery.successCount,
        failureCount: delivery.failureCount,
        attempted: delivery.attempted,
      };
    } else {
      results[channel] = { status: "unsupported" };
    }
  }
  return { announcementId: id, audience, channels: results };
}
