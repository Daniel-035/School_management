import request from "supertest";
import { app, auth, login, resetAndSeed } from "./helpers";

beforeEach(resetAndSeed);

describe("student, class, subject, and attendance routes", () => {
  test("covers class, subject, and student CRUD routes", async () => {
    const admin = await login("admin@school.local", "admin123");
    const staff = await login("staff@school.local", "admin123");
    const headers = auth(admin.accessToken);

    await request(app).get("/api/students/classes").set(headers).expect(200);
    const createdClass = await request(app).post("/api/students/classes").set(headers)
      .send({ grade: "8", section: "A", name: "Class 8A" }).expect(201);
    const classId = createdClass.body.data.class.id;
    await request(app).get(`/api/students/classes/${classId}`).set(headers).expect(200);
    await request(app).put(`/api/students/classes/${classId}`).set(headers).send({ name: "Grade 8A" }).expect(200);
    await request(app).post("/api/students/classes").set(auth(staff.accessToken))
      .send({ grade: "9", section: "A", name: "Class 9A" }).expect(403);

    await request(app).get("/api/students/subjects").set(headers).expect(200);
    await request(app).post("/api/students/subjects").set(headers).send({ name: "Art", code: "ART" }).expect(201);

    await request(app).get("/api/students").set(headers).expect(200);
    await request(app).get("/api/students?classSectionId=cs-5a&parentId=u-parent-1").set(headers).expect(200)
      .expect(({ body }) => expect(body.data.students).toHaveLength(1));
    const createdStudent = await request(app).post("/api/students").set(headers)
      .send({ firstName: "Test", lastName: "Student", classSectionId: classId, parentIds: ["u-parent-1"] }).expect(201);
    const studentId = createdStudent.body.data.student.id;
    await request(app).get(`/api/students/${studentId}`).set(headers).expect(200);
    await request(app).put(`/api/students/${studentId}`).set(headers).send({ rollNumber: "99" }).expect(200);
    await request(app).delete(`/api/students/${studentId}`).set(headers).expect(200);
    await request(app).get(`/api/students/${studentId}`).set(headers).expect(404);
    await request(app).delete(`/api/students/classes/${classId}`).set(headers).expect(200);
    await request(app).get("/api/students").expect(401);
  });

  test("covers attendance, summaries, bulk marking, and leave routes", async () => {
    const staff = await login("staff@school.local", "admin123");
    const parent = await login("parent@school.local", "admin123");
    const admin = await login("admin@school.local", "admin123");
    const staffHeaders = auth(staff.accessToken);
    const date = "2026-07-16";

    await request(app).post("/api/attendance").set(staffHeaders)
      .send({ studentId: "stu-1", classSectionId: "cs-5a", date, status: "present" }).expect(201);
    await request(app).post("/api/attendance/bulk").set(staffHeaders)
      .send({ classSectionId: "cs-5a", date, status: "late" }).expect(200)
      .expect(({ body }) => expect(body.data.count).toBe(1));
    await request(app).get("/api/attendance/student/stu-1").set(staffHeaders).expect(200);
    await request(app).get(`/api/attendance/class/cs-5a?date=${date}`).set(staffHeaders).expect(200);
    await request(app).get("/api/attendance/summary/stu-1?month=2026-07").set(staffHeaders).expect(200);

    const leave = await request(app).post("/api/attendance/leave").set(auth(parent.accessToken)).send({
      studentId: "stu-1", parentId: "u-parent-1", fromDate: "2026-08-01", toDate: "2026-08-02", reason: "Travel",
    }).expect(201);
    await request(app).get("/api/attendance/leave?status=pending").set(staffHeaders).expect(200);
    await request(app).put(`/api/attendance/leave/${leave.body.data.request.id}`).set(auth(admin.accessToken))
      .send({ status: "approved", reviewedBy: "u-admin" }).expect(200);
    await request(app).post("/api/attendance").set(auth(parent.accessToken))
      .send({ studentId: "stu-1", classSectionId: "cs-5a", date, status: "present" }).expect(403);
    await request(app).post("/api/attendance").set(staffHeaders).send({ status: "bad" }).expect(400);
  });
});
