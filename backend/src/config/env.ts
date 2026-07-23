import "dotenv/config";
import { z } from "zod";

const serviceAccountSchema = z.string().transform((value, context) => {
  try {
    const parsed = JSON.parse(value) as Record<string, unknown>;
    for (const field of ["project_id", "client_email", "private_key"] as const) {
      if (typeof parsed[field] !== "string" || parsed[field].length === 0) {
        context.addIssue({ code: z.ZodIssueCode.custom, message: `${field} is required` });
        return z.NEVER;
      }
    }
    return value;
  } catch {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "must be valid JSON" });
    return z.NEVER;
  }
});

const envSchema = z.object({
  PORT: z.coerce.number().int().min(1).max(65535).default(8080),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must contain at least 32 characters").optional(),
  JWT_EXPIRES_IN: z.string().regex(/^\d+[smhd]$/, "JWT_EXPIRES_IN must look like 15m, 1h, or 7d").default("15m"),
  REFRESH_TOKEN_EXPIRES_IN_DAYS: z.coerce.number().int().min(1).max(365).default(30),
  BCRYPT_ROUNDS: z.coerce.number().int().min(10).max(15).default(12),
  FIRESTORE_PROJECT_ID: z.string().min(1),
  FIREBASE_SERVICE_ACCOUNT: serviceAccountSchema.optional(),
  FIREBASE_WEB_API_KEY: z.string().min(20, "FIREBASE_WEB_API_KEY is required for Firebase Authentication login"),
  FIREBASE_STORAGE_BUCKET: z.string().min(1),
  CORS_ORIGINS: z.string().default("http://localhost:5173"),
  AUTH_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(900000),
  AUTH_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(20),
  SEED_DEMO_DATA: z.enum(["true", "false"]).default("false").transform(value => value === "true"),
  ADMIN_EMAIL: z.string().email(),
  ADMIN_PASSWORD: z.string().min(8, "ADMIN_PASSWORD must contain at least 8 characters"),
  APP_NAME: z.string().min(1).default("OmniSchool"),
  APP_BASE_URL: z.string().url().default("http://localhost:5173"),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().min(1).max(65535).default(587),
  SMTP_SECURE: z.enum(["true", "false"]).default("false").transform(value => value === "true"),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().email().optional(),
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  PAYU_MERCHANT_KEY: z.string().optional(),
  PAYU_MERCHANT_SALT: z.string().optional(),
  PHONEPE_MERCHANT_ID: z.string().optional(),
  PHONEPE_SALT_KEY: z.string().optional(),
  SENTRY_DSN: z.string().url().optional(),
  SENTRY_TRACES_SAMPLE_RATE: z.coerce.number().min(0).max(1).default(0.1),
  REQUIRE_HTTPS: z.enum(["true", "false"]).default("false").transform(value => value === "true"),
});

const parsed = envSchema.superRefine((value, context) => {
  if (!process.env.FIRESTORE_EMULATOR_HOST && !value.FIREBASE_SERVICE_ACCOUNT && value.NODE_ENV !== "production") {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["FIREBASE_SERVICE_ACCOUNT"],
      message: "is required outside the Firestore emulator or production ADC",
    });
  }
}).safeParse(process.env);

if (!parsed.success) {
  const details = parsed.error.issues.map(issue => `${issue.path.join(".")}: ${issue.message}`).join("; ");
  throw new Error(`Invalid environment configuration: ${details}`);
}

export const env = parsed.data;
export const corsOrigins = env.CORS_ORIGINS.split(",").map(origin => origin.trim()).filter(Boolean);

