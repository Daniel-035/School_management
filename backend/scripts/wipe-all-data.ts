import * as fs from "fs";
import { cert, initializeApp, ServiceAccount } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { getStorage } from "firebase-admin/storage";

const SERVICE_ACCOUNT_PATH =
  "C:\\Users\\rishi\\Downloads\\schoolmanagement-23f78-firebase-adminsdk-fbsvc-544e432d84.json";

const serviceAccount = JSON.parse(
  fs.readFileSync(SERVICE_ACCOUNT_PATH, "utf-8")
) as ServiceAccount;

const app = initializeApp({
  credential: cert(serviceAccount),
  projectId: "schoolmanagement-23f78",
  storageBucket: "schoolmanagement-23f78.firebasestorage.app",
});

const db = getFirestore(app);
const auth = getAuth(app);
const bucket = getStorage(app).bucket();

const COLLECTIONS = [
  "announcements",
  "attendanceRecords",
  "chatMessages",
  "classSections",
  "examSchedules",
  "feePayments",
  "feeStructures",
  "homework",
  "leaveRequests",
  "messageThreads",
  "refreshSessions",
  "schoolEvents",
  "students",
  "subjects",
  "users",
];

async function deleteCollection(path: string, batchSize = 500): Promise<number> {
  let deleted = 0;
  while (true) {
    const snapshot = await db.collection(path).limit(batchSize).get();
    if (snapshot.empty) break;
    const batch = db.batch();
    snapshot.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
    deleted += snapshot.size;
    if (snapshot.size < batchSize) break;
  }
  return deleted;
}

async function deleteSubcollections(
  parentPath: string,
  subName: string
): Promise<number> {
  let deleted = 0;
  const parents = await db.collection(parentPath).get();
  for (const parent of parents.docs) {
    deleted += await deleteCollection(`${parentPath}/${parent.id}/${subName}`);
  }
  return deleted;
}

async function deleteAllAuthUsers(): Promise<number> {
  let deleted = 0;
  while (true) {
    const list = await auth.listUsers(1000);
    if (list.users.length === 0) break;
    const uids = list.users.map((u) => u.uid);
    await auth.deleteUsers(uids);
    deleted += uids.length;
    if (uids.length < 1000) break;
  }
  return deleted;
}

async function deleteAllStorageFiles(): Promise<number> {
  let deleted = 0;
  const [files] = await bucket.getFiles();
  for (const file of files) {
    await file.delete();
    deleted++;
  }
  return deleted;
}

async function main() {
  console.log("Starting full data wipe...");

  const subDeleted = await deleteSubcollections("messageThreads", "messages");
  console.log(`Deleted ${subDeleted} subcollection documents`);

  for (const col of COLLECTIONS) {
    const count = await deleteCollection(col);
    console.log(`Cleared ${col}: ${count} documents deleted`);
  }

  const authDeleted = await deleteAllAuthUsers();
  console.log(`Deleted ${authDeleted} Firebase Auth users`);

  let storageDeleted = 0;
  try {
    storageDeleted = await deleteAllStorageFiles();
  } catch (error) {
    console.log(`Storage cleanup skipped: ${error}`);
  }
  console.log(`Deleted ${storageDeleted} Storage files`);

  console.log("Full data wipe complete.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Wipe failed:", error);
    process.exit(1);
  });
