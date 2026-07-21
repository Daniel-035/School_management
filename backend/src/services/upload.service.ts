import { randomUUID } from "crypto";
import { bucket } from "../config/firebase";

export async function upload(userId: string, purpose: string, file: Express.Multer.File) {
  const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
  const objectPath = `${purpose}/${userId}/${randomUUID()}-${safeName}`;
  await bucket.file(objectPath).save(file.buffer, { contentType: file.mimetype, resumable: false, metadata: { cacheControl: "private,max-age=3600" } });
  const expires = Date.now() + 15 * 60 * 1000;
  const [signedUrl] = await bucket.file(objectPath).getSignedUrl({ action: "read", expires });
  return { objectPath, signedUrl, expiresAt: new Date(expires).toISOString(), contentType: file.mimetype, size: file.size };
}
