import { initializeApp, cert, getApps, App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';

const EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST;

function ensureApp(): App {
  if (getApps().length > 0) return getApps()[0];

  // Emulator mode — no credentials required
  if (EMULATOR_HOST) {
    return initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID ?? 'demo-social-media-crawl',
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    });
  }

  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!serviceAccount) {
    throw new Error(
      'Missing FIREBASE_SERVICE_ACCOUNT env var. Add your Firebase service account JSON to .env.local, or set FIRESTORE_EMULATOR_HOST=localhost:8080 to use the local emulator.'
    );
  }

  let parsed: object;
  try {
    parsed = JSON.parse(serviceAccount);
  } catch {
    throw new Error(
      'FIREBASE_SERVICE_ACCOUNT is not valid JSON. Paste the full service account JSON as a single line.'
    );
  }

  return initializeApp({
    credential: cert(parsed as Parameters<typeof cert>[0]),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  });
}

export function db() {
  return getFirestore(ensureApp());
}

export function auth() {
  return getAuth(ensureApp());
}

export function storage() {
  return getStorage(ensureApp());
}
