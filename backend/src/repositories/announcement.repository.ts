import { Announcement } from "../types";
import { resolveSeedId } from "../seed-context";
import { create, findAll, findById, remove, seedCollection, update } from "./firestore.repository";

const COLLECTION = "announcements";

class AnnouncementRepository {
  async seed() {
    const now = new Date();
    const admin = resolveSeedId("u-admin");
    await seedCollection<Announcement>(COLLECTION, [
      { id: "ann-1", title: "Parent-Teacher Meeting on Saturday", body: "The next PTM is scheduled for Saturday between 9 AM and 12 PM. Please book a slot through the calendar section.", authorId: admin, authorName: "Principal's Office", channels: ["push", "email"], audience: ["all"], pinned: true, publishedAt: new Date(now.getTime() - 21600000).toISOString(), createdAt: now, updatedAt: now },
      { id: "ann-2", title: "Annual Sports Day - 5 Aug", body: "Annual Sports Day registrations are open. Please send the consent form by 1 Aug.", authorId: admin, authorName: "Sports Department", channels: ["push"], audience: ["parents", "staff"], pinned: false, publishedAt: new Date(now.getTime() - 2 * 86400000).toISOString(), createdAt: now, updatedAt: now },
      { id: "ann-3", title: "Holiday on account of local elections", body: "The school will remain closed on the polling day declared by the district collector.", authorId: admin, authorName: "Administration", channels: ["push", "sms"], audience: ["all"], pinned: false, publishedAt: new Date(now.getTime() - 4 * 86400000).toISOString(), createdAt: now, updatedAt: now },
    ]);
  }

  async findAll() {
    return (await findAll<Announcement>(COLLECTION)).sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.publishedAt.localeCompare(a.publishedAt));
  }
  findById(id: string) { return findById<Announcement>(COLLECTION, id); }
  create(data: Omit<Announcement, "id" | "createdAt" | "updatedAt">) { return create<Announcement>(COLLECTION, data); }
  update(id: string, data: Partial<Announcement>) { return update<Announcement>(COLLECTION, id, data); }
  delete(id: string) { return remove(COLLECTION, id); }
}

export const announcementRepository = new AnnouncementRepository();
