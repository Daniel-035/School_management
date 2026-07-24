import type { Announcement, CalendarEvent } from "@/types";
import { api } from "./api";

export interface CreateAnnouncementInput {
  title: string;
  body: string;
  channels: Announcement["channels"];
  audience: Announcement["audience"];
  pinned?: boolean;
}

export const announcementService = {
  async getAll(): Promise<Announcement[]> {
    const result = await api.get<{ announcements: Announcement[] } | Announcement[]>("/announcements");
    if (Array.isArray(result)) return result;
    return result?.announcements || [];
  },

  async create(payload: CreateAnnouncementInput): Promise<Announcement> {
    const result = await api.post<{ announcement: Announcement }>("/announcements", payload);
    return result.announcement;
  },

  async send(id: string, payload: { channels?: Announcement["channels"]; audience?: Announcement["audience"] }): Promise<{ delivery: Record<string, { status: string; messageId?: string }> }> {
    return api.post(`/announcements/${id}/send`, payload);
  },
};

export const calendarService = {
  async getEvents(): Promise<CalendarEvent[]> {
    const result = await api.get<{ events: CalendarEvent[] } | CalendarEvent[]>("/events");
    if (Array.isArray(result)) return result;
    return result?.events || [];
  },

  async createEvent(payload: Omit<CalendarEvent, "id" | "createdAt" | "updatedAt">): Promise<CalendarEvent> {
    const result = await api.post<{ event: CalendarEvent }>("/events", payload);
    return result.event;
  },
};
