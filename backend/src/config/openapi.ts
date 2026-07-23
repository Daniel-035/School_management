export const openapi = {
  openapi: "3.0.3",
  info: { title: "OmniSchool API", version: "1.0.0", description: "School management API" },
  servers: [{ url: "/api" }],
  components: { securitySchemes: { bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" } } },
  paths: {
    "/auth/login": { post: { summary: "Log in", responses: { "200": { description: "Authenticated" } } } },
    "/auth/reset-password": { post: { summary: "Create a password reset link", responses: { "200": { description: "Link created" } } } },
    "/auth/verify-email": { post: { summary: "Create an email verification link", responses: { "200": { description: "Link created" } } } },
    "/users/import": { post: { summary: "Import users from CSV", security: [{ bearerAuth: [] }], responses: { "200": { description: "Import result" } } } },
    "/attendance/bulk": { post: { summary: "Mark class attendance", security: [{ bearerAuth: [] }], responses: { "200": { description: "Attendance marked" } } } },
    "/uploads": { post: { summary: "Upload a file and receive a signed URL", security: [{ bearerAuth: [] }], responses: { "201": { description: "Uploaded" } } } },
    "/announcements/{id}/send": { post: { summary: "Dispatch an announcement", security: [{ bearerAuth: [] }], parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Dispatch result" } } } },
  },
};
