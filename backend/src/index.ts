import { env } from "./config/env";
import { createApp } from "./app";
import { seedDemoData } from "./seed";
import { initSentry } from "./observability/sentry";

async function bootstrap() {
  initSentry();
  if (env.SEED_DEMO_DATA) {
    await seedDemoData();
    console.log("Seeded demo data in Firestore");
  }

  const app = createApp();
  const port = env.PORT;
  app.listen(port, "0.0.0.0", () => {
    console.log(`EduConnect API running on http://0.0.0.0:${port}`);
  });
}

bootstrap().catch(err => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
