import request from "supertest";
import { app, auth, login, resetAndSeed } from "./helpers";

beforeEach(resetAndSeed);

describe("homework, exam, grade, and fee routes", () => {
  test("covers every homework route", async () => {
    const staff = await login("staff@school.local", "admin123");
    const parent = await login("parent@school.local", "admin123");
    const admin = await login("admin@school.local", "admin123");
    const staffHeaders = auth(staff.accessToken);

    await request(app).get("/api/homework").set(staffHeaders).expect(200);
    await request(app).get("/api/homework/class/cs-5a").set(staffHeaders).expect(200)
      .expect(({ body }) => expect(body.data.homework.every((item: { classSectionId: string }) => item.classSectionId === "cs-5a")).toBe(true));
    await request(app).get("/api/homework/student/stu-1").set(staffHeaders).expect(200);
    await request(app).get("/api/homework/hw-1").set(staffHeaders).expect(200);

    const created = await request(app).post("/api/homework").set(staffHeaders).send({
      title: "Integration homework",
      description: "Complete the integration exercise",
      subjectId: "sub-math",
      classSectionId: "cs-5a",
      dueDate: "2026-08-01",
      attachments: [],
    }).expect(201);
    const id = created.body.data.homework.id;
    await request(app).put(`/api/homework/${id}`).set(staffHeaders).send({ title: "Updated homework" }).expect(200);
    await request(app).delete(`/api/homework/${id}`).set(auth(admin.accessToken)).expect(200);
    await request(app).get(`/api/homework/${id}`).set(staffHeaders).expect(404);
    await request(app).post("/api/homework").set(auth(parent.accessToken)).send({}).expect(403);
  });

  test("covers every exam, grade, report, and performance route", async () => {
    const staff = await login("staff@school.local", "admin123");
    const parent = await login("parent@school.local", "admin123");
    const admin = await login("admin@school.local", "admin123");
    const headers = auth(staff.accessToken);

    await request(app).get("/api/exams").set(headers).expect(200);
    await request(app).get("/api/exams/class/cs-5a").set(headers).expect(200)
      .expect(({ body }) => expect(body.data.exams.every((item: { classSectionId: string }) => item.classSectionId === "cs-5a")).toBe(true));
    await request(app).get("/api/exams/exam-1").set(headers).expect(200);
    const created = await request(app).post("/api/exams").set(headers).send({
      subjectId: "sub-math", classSectionId: "cs-5a", title: "Integration Exam", date: "2026-08-10", maxMarks: 100,
    }).expect(201);
    const examId = created.body.data.exam.id;
    await request(app).put(`/api/exams/${examId}`).set(headers).send({ maxMarks: 80 }).expect(200);

    await request(app).get("/api/exams/grades").set(headers).expect(200);
    await request(app).post("/api/exams/grades").set(headers).send({
      studentId: "stu-1", examScheduleId: examId, subjectId: "sub-math", marks: 70, remarks: "Good",
    }).expect(201);
    await request(app).get("/api/exams/grades?studentId=stu-1").set(headers).expect(200);
    await request(app).get("/api/exams/report/stu-1").set(headers).expect(200);
    await request(app).get("/api/exams/performance/cs-5a").set(headers).expect(200);
    await request(app).post("/api/exams/grades").set(auth(parent.accessToken)).send({}).expect(403);
    await request(app).delete(`/api/exams/${examId}`).set(auth(admin.accessToken)).expect(200);
    await request(app).get(`/api/exams/${examId}`).set(headers).expect(404);
  });

  test("covers every fee structure, payment, and summary route", async () => {
    const admin = await login("admin@school.local", "admin123");
    const parent = await login("parent@school.local", "admin123");
    const staff = await login("staff@school.local", "admin123");
    const adminHeaders = auth(admin.accessToken);

    await request(app).get("/api/fees/structures").set(adminHeaders).expect(200);
    await request(app).get("/api/fees/structures/fs-1").set(adminHeaders).expect(200);
    await request(app).post("/api/fees/structures").set(adminHeaders).send({
      name: "Integration Fee", classSectionId: "cs-5a", term: "Term 3", dueDate: "2026-09-01",
      components: [{ name: "Tuition", amount: 1000 }],
    }).expect(201);

    await request(app).get("/api/fees/payments").set(adminHeaders).expect(200);
    await request(app).get("/api/fees/payments/fp-1").set(adminHeaders).expect(200);
    const payment = await request(app).post("/api/fees/payments").set(adminHeaders).send({
      studentId: "stu-1", feeStructureId: "fs-1", amountDue: 1000,
    }).expect(201);
    await request(app).post(`/api/fees/payments/${payment.body.data.payment.id}/pay`).set(auth(parent.accessToken)).send({
      amountPaid: 1000, paymentMethod: "UPI", transactionId: "TEST-1", paidAt: "2026-07-16",
    }).expect(200).expect(({ body }) => expect(body.data.payment.status).toBe("paid"));
    await request(app).get("/api/fees/summary").set(adminHeaders).expect(200);
    await request(app).get("/api/fees/summary").set(auth(staff.accessToken)).expect(403);
    await request(app).post("/api/fees/structures").set(auth(parent.accessToken)).send({}).expect(403);
  });
});
