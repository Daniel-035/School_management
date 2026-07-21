import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { validateBody } from "../validators";
import { z } from "zod";
import { db } from "../config/firebase";

const router = Router();
router.use(authenticate);

const COLLECTION = "devices";

const deviceSchema = z.object({
  token: z.string().min(1),
  platform: z.enum(["ios", "android", "web"]),
});

router.post("/", validateBody(deviceSchema), async (req, res, next) => {
  try {
    const { token, platform } = req.body as { token: string; platform: string };
    const userId = req.user!.userId;
    const role = req.user!.role;
    const docId = `${userId}:${token}`;
    await db.collection(COLLECTION).doc(docId).set({
      userId,
      role,
      token,
      platform,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

router.delete("/", async (req, res, next) => {
  try {
    const userId = req.user!.userId;
    const snapshot = await db.collection(COLLECTION).where("userId", "==", userId).get();
    const batch = db.batch();
    for (const doc of snapshot.docs) batch.delete(doc.ref);
    await batch.commit();
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

router.get("/", async (req, res, next) => {
  try {
    const userId = req.user!.userId;
    const snapshot = await db.collection(COLLECTION).where("userId", "==", userId).get();
    const devices = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json({ success: true, data: { devices } });
  } catch (error) {
    next(error);
  }
});

export default router;
