import request from "supertest";
import { messaging } from "../src/config/firebase";
import { app, auth, login, resetAndSeed } from "./helpers";

beforeEach(resetAndSeed);

describe("announcement, communication, and event routes", () => {
  test("covers every announcement route including delivery", async () => {
    const admin = await login("admin@school.local", "admin123");
    const parent = await login("parent@school.local", "admin123");
    const headers = auth(admin.accessToken);
    jest.spyOn(messaging, "send").mockResolvedValue("test-message-id");

    await request(app).get("/api/announcements").set(headers).expect(200);
    await request(app).get("/api/announcements/ann-1").set(headers).expect(200);
    const created = await request(app).post("/api/announcements").set(headers).send({
      title: "Integration announcement", body: "Test announcement", channels: ["push", "email"], audience: ["all"], pinned: false,
    }).expect(201);
    const id = created.body.data.announcement.id;
    await request(app).post(`/api/announcements/${id}/send`).set(headers)
      .send({ channels: ["push", "email"], audience: ["all"] }).expect(200)
      .expect(({ body }) => {
        expect(body.data.delivery.channels.push.status).toBe("sent");
        expect(body.data.delivery.channels.email.status).toBe("unsupported");
      });
    await request(app).put(`/api/announcements/${id}`).set(headers).send({ pinned: true }).expect(200);
    await request(app).delete(`/api/announcements/${id}`).set(headers).expect(200);
    await request(app).post("/api/announcements").set(auth(parent.accessToken)).send({}).expect(403);
  });

  test("covers every communication route", async () => {
    const parent = await login("parent@school.local", "admin123");
    const headers = auth(parent.accessToken);

    await request(app).get("/api/communication/threads?parentId=u-parent-1").set(headers).expect(200);
    const created = await request(app).post("/api/communication/threads").set(headers).send({
      parentId: "u-parent-1", teacherId: "u-teacher-1", teacherName: "Anita Verma",
      teacherSubject: "Mathematics", studentId: "stu-1",
    }).expect(201);
    const id = created.body.data.thread.id;
    await request(app).get(`/api/communication/threads/${id}/messages`).set(headers).expect(200);
    await request(app).post(`/api/communication/threads/${id}/messages`).set(headers)
      .send({ text: "Integration test message" }).expect(201)
      .expect(({ body }) => expect(body.data.message.senderId).toBe("u-parent-1"));
    await request(app).get(`/api/communication/threads/${id}/messages`).set(headers).expect(200)
      .expect(({ body }) => expect(body.data.messages).toHaveLength(1));
    await request(app).post(`/api/communication/threads/${id}/messages`).set(headers).send({ text: "" }).expect(400);
  });

  test("covers every calendar route and role enforcement", async () => {
    const admin = await login("admin@school.local", "admin123");
    const staff = await login("staff@school.local", "admin123");
    const headers = auth(admin.accessToken);

    await request(app).get("/api/events").set(headers).expect(200);
    await request(app).get("/api/events/event-1").set(headers).expect(200);
    const created = await request(app).post("/api/events").set(headers).send({
      title: "Integration Event", description: "Test event", type: "event", date: "2026-10-01",
    }).expect(201);
    const id = created.body.data.event.id;
    await request(app).put(`/api/events/${id}`).set(headers).send({ title: "Updated Event" }).expect(200);
    await request(app).delete(`/api/events/${id}`).set(headers).expect(200);
    await request(app).get(`/api/events/${id}`).set(headers).expect(404);
    await request(app).post("/api/events").set(auth(staff.accessToken)).send({}).expect(403);
  });
});
