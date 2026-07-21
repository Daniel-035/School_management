import { calendarRepository } from "../repositories/calendar.repository";
import { NotFoundError } from "../utils/errors";

export async function listEvents() {
  return calendarRepository.findAll();
}

export async function getEvent(id: string) {
  const event = await calendarRepository.findById(id);
  if (!event) throw new NotFoundError("Event");
  return event;
}

export async function createEvent(data: { title: string; description: string; type: string; date: string }) {
  return calendarRepository.create(data);
}

export async function updateEvent(id: string, data: Partial<{ title: string; description: string; type: string; date: string }>) {
  const event = await calendarRepository.update(id, data);
  if (!event) throw new NotFoundError("Event");
  return event;
}

export async function deleteEvent(id: string) {
  const removed = await calendarRepository.delete(id);
  if (!removed) throw new NotFoundError("Event");
}
