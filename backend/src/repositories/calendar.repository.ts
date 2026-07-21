import { SchoolEvent } from "../types";
import { create, findAll, findById, remove, seedCollection, update } from "./firestore.repository";

const COLLECTION = "schoolEvents";

class CalendarRepository {
  async seed() {
    const today = new Date();
    const now = new Date();
    const date = (days: number) => new Date(today.getTime() + days * 86400000).toISOString().slice(0, 10);
    await seedCollection<SchoolEvent>(COLLECTION, [
      { id: "event-1", title: "Independence Day Assembly", description: "Flag hoisting at 8:00 AM followed by cultural programme.", type: "holiday", date: date(15), createdAt: now, updatedAt: now },
      { id: "event-2", title: "Parent-Teacher Meeting", description: "Book a 15-minute slot per child.", type: "ptm", date: date(4), createdAt: now, updatedAt: now },
      { id: "event-3", title: "Annual Sports Day", description: "Track and field events. Parents welcome.", type: "event", date: date(22), createdAt: now, updatedAt: now },
      { id: "event-4", title: "Holiday - Ganesh Chaturthi", description: "School will remain closed.", type: "holiday", date: date(11), createdAt: now, updatedAt: now },
    ]);
  }

  async findAll() { return (await findAll<SchoolEvent>(COLLECTION)).sort((a, b) => a.date.localeCompare(b.date)); }
  findById(id: string) { return findById<SchoolEvent>(COLLECTION, id); }
  create(data: Omit<SchoolEvent, "id" | "createdAt" | "updatedAt">) { return create<SchoolEvent>(COLLECTION, data); }
  update(id: string, data: Partial<SchoolEvent>) { return update<SchoolEvent>(COLLECTION, id, data); }
  delete(id: string) { return remove(COLLECTION, id); }
}

export const calendarRepository = new CalendarRepository();
