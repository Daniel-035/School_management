import nodemailer, { Transporter } from "nodemailer";
import { env } from "../config/env";
import { logger } from "../config/logger";

let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  if (!env.SMTP_HOST || !env.SMTP_FROM) return null;
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth: env.SMTP_USER && env.SMTP_PASS ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
  });
  return transporter;
}

export function isEmailDeliveryEnabled(): boolean {
  return getTransporter() !== null;
}

export interface CredentialsEmailInput {
  to: string;
  name: string;
  username: string;
  password: string;
}

export async function sendCredentialsEmail(input: CredentialsEmailInput): Promise<boolean> {
  const transport = getTransporter();
  if (!transport) {
    logger.warn({ to: input.to }, "SMTP not configured; credentials were not emailed. Returning them to the admin for manual delivery.");
    return false;
  }
  const html = renderCredentialsEmail(input.name, input.username, input.password);
  await transport.sendMail({
    from: env.SMTP_FROM,
    to: input.to,
    subject: `Your ${env.APP_NAME} login credentials`,
    text: `Welcome to ${env.APP_NAME}, ${input.name}.\n\nYour account has been created.\n\nUsername: ${input.username}\nTemporary password: ${input.password}\n\nUse these credentials to sign in for the first time. This password was generated for you and cannot be reset by you. Please keep it secure.\n\n${env.APP_NAME}`,
    html,
  });
  return true;
}

function renderCredentialsEmail(name: string, username: string, password: string): string {
  return [
    `<div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:auto;color:#1f2937">`,
    `<h2 style="color:#0f172a">Welcome to ${env.APP_NAME}</h2>`,
    `<p>Hello ${name},</p>`,
    `<p>Your account has been created by an administrator. Use the credentials below to sign in for the first time:</p>`,
    `<table style="width:100%;border-collapse:collapse;margin:16px 0">`,
    `<tr><td style="padding:8px 12px;font-weight:600;color:#475569;width:140px">Username</td><td style="padding:8px 12px;background:#f8fafc;border-radius:6px;font-family:monospace;font-size:15px">${username}</td></tr>`,
    `<tr><td style="padding:8px 12px;font-weight:600;color:#475569">Password</td><td style="padding:8px 12px;background:#f8fafc;border-radius:6px;font-family:monospace;font-size:15px;letter-spacing:1px">${password}</td></tr>`,
    `</table>`,
    `<p style="color:#475569;font-size:13px">This password was generated for you. You cannot create or change your own password; contact an administrator if you lose it.</p>`,
    `<hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0" />`,
    `<p style="color:#94a3b8;font-size:12px">${env.APP_NAME} &middot; ${env.APP_BASE_URL}</p>`,
    `</div>`,
  ].join("");
}
