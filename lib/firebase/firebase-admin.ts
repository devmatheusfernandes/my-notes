import * as admin from "firebase-admin";

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n").replace(/^"(.*)"$/, "$1");
const storageBucket = process.env.FIREBASE_STORAGE_BUCKET;

if (!admin.apps.length) {
  if (!projectId || !clientEmail || !privateKey) {
    console.error("Firebase Admin Error: Missing environment variables.", {
      projectId: !!projectId,
      clientEmail: !!clientEmail,
      privateKey: !!privateKey,
    });
  } else {
    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          project_id: projectId,
          client_email: clientEmail,
          private_key: privateKey,
        } as any),
        storageBucket: storageBucket,
      });
    } catch (error) {
      console.error("Erro na inicialização do Firebase Admin:", error);
    }
  }
}

export const adminDb = admin.firestore();
export const adminAuth = admin.auth();
export const adminStorage = admin.storage();