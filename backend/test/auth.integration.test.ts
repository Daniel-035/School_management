import request from "supertest";
import { app, auth, login, resetAndSeed } from "./helpers";

beforeEach(resetAndSeed);

describe("health and authentication routes", () => {
  test("allows Flutter web preflight from dynamic local ports", async () => {
    await request(app)
      .options("/api/auth/login")
      .set("Origin", "http://localhost:54321")
      .set("Access-Control-Request-Method", "POST")
      .set("Access-Control-Request-Headers", "content-type")
      .expect(204)
      .expect("Access-Control-Allow-Origin", "http://localhost:54321")
      .expect("Access-Control-Allow-Credentials", "true");

    const untrusted = await request(app)
      .options("/api/auth/login")
      .set("Origin", "https://untrusted.example")
      .set("Access-Control-Request-Method", "POST")
      .set("Access-Control-Request-Headers", "content-type");
    expect(untrusted.headers["access-control-allow-origin"]).toBeUndefined();
  });

  test("serves health, readiness, OpenAPI, and not-found routes", async () => {
    await request(app).get("/health").expect(200).expect(({ body }) => expect(body.status).toBe("ok"));
    await request(app).get("/healthz").expect(200, { status: "ok" });
    await request(app).get("/readyz").expect(200, { status: "ready" });
    await request(app).get("/openapi.json").expect(200).expect(({ body }) => expect(body.openapi).toBeDefined());
    await request(app).get("/missing").expect(404).expect(({ body }) => expect(body.error.code).toBe("NOT_FOUND"));
  });

  test("logs in via Firebase Auth, returns the user, refreshes tokens, and logs out", async () => {
    const session = await login("admin@school.local", "admin123");
    expect(session.user).toMatchObject({ role: "admin" });
    expect(session.accessToken).toBeTruthy();
    expect(session.refreshToken).toBeTruthy();

    await request(app).get("/api/auth/me").set(auth(session.accessToken)).expect(200)
      .expect(({ body }) => expect(body.data.user.passwordHash).toBeUndefined());

    const refresh = await request(app).post("/api/auth/refresh")
      .send({ refreshToken: session.refreshToken }).expect(200);
    expect(refresh.body.data.accessToken).toBeTruthy();

    const logoutSession = await login("admin@school.local", "admin123");
    await request(app).post("/api/auth/logout").send({ refreshToken: logoutSession.refreshToken }).expect(200);
  });

  test("logs out all devices and rejects invalid authentication payloads", async () => {
    const first = await login("admin@school.local", "admin123");
    const second = await login("admin@school.local", "admin123");
    await request(app).post("/api/auth/logout-all").set(auth(first.accessToken)).send({}).expect(200);
    await request(app).get("/api/auth/me").set(auth(second.accessToken)).expect(401);
    await request(app).post("/api/auth/refresh").send({ refreshToken: second.refreshToken }).expect(401);
    await request(app).post("/api/auth/login").send({ email: "admin@school.local", password: "wrong" }).expect(401);
    await request(app).post("/api/auth/login").send({ email: "invalid", password: "x" }).expect(400);
    await request(app).get("/api/auth/me").expect(401);
  });
});
