/**
 * Migration: extract likes from outreach_notes and write to likes_count field.
 *
 * Run: node scripts/migrate-likes-count.mjs
 *
 * Uses the same service account already in .env.local.
 * Processes all documents in batches of 500 (Firestore write-batch limit).
 * Safe to re-run — only updates documents where likes_count is missing or 0
 * and outreach_notes contains a parseable number.
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env.local manually (no dotenv dependency needed)
function loadEnv() {
  const envPath = resolve(__dirname, '../.env.local');
  const raw = readFileSync(envPath, 'utf8');
  const env = {};
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim();
    env[key] = val;
  }
  return env;
}

function extractLikes(notes) {
  if (!notes) return 0;

  // Pattern: explicit label before number
  const labelMatch = notes.match(
    /(?:likes?|❤️|点赞|赞)[:\s]*([0-9][0-9,_.]*)\s*([kKwW万]?)/i
  );
  if (labelMatch) return parseShorthand(labelMatch[1], labelMatch[2]);

  // Pattern: number before label
  const suffixMatch = notes.match(
    /([0-9][0-9,_.]*)\s*([kKwW万]?)\s*(?:likes?|❤️|点赞|赞)/i
  );
  if (suffixMatch) return parseShorthand(suffixMatch[1], suffixMatch[2]);

  // Fallback: first standalone number >= 10
  const numMatch = notes.match(/\b([0-9][0-9,_.]{1,})\b/);
  if (numMatch) {
    const n = parseInt(numMatch[1].replace(/[,_]/g, ''), 10);
    if (n >= 10) return n;
  }

  return 0;
}

function parseShorthand(digits, suffix) {
  const base = parseFloat(digits.replace(/[,_]/g, ''));
  const s = (suffix ?? '').toLowerCase();
  if (s === 'k') return Math.round(base * 1_000);
  if (s === 'w' || s === '万') return Math.round(base * 10_000);
  return Math.round(base);
}

async function main() {
  const env = loadEnv();

  if (!env.FIREBASE_SERVICE_ACCOUNT) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT not found in .env.local');
  }

  // Dynamic import firebase-admin
  const { initializeApp, cert, getApps } = await import('firebase-admin/app');
  const { getFirestore } = await import('firebase-admin/firestore');

  const serviceAccount = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT);
  const app = getApps().length > 0 ? getApps()[0] : initializeApp({ credential: cert(serviceAccount) });
  const firestore = getFirestore(app);

  console.log('Fetching all creator documents...');
  const snapshot = await firestore.collection('creators').get();
  console.log(`Total documents: ${snapshot.size}`);

  const BATCH_SIZE = 499; // Firestore max is 500 ops per batch
  let updated = 0;
  let skipped = 0;
  let noLikes = 0;
  let batch = firestore.batch();
  let batchCount = 0;

  const flush = async () => {
    if (batchCount > 0) {
      await batch.commit();
      batch = firestore.batch();
      batchCount = 0;
    }
  };

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const existingLikesCount = data.likes_count;
    const notes = data.outreach_notes ?? null;
    const extracted = extractLikes(notes);

    // Skip if likes_count already set to a non-zero value matching what we'd extract
    if (typeof existingLikesCount === 'number' && existingLikesCount > 0) {
      skipped++;
      continue;
    }

    if (extracted === 0) {
      // Still set 0 so the field exists and queries work
      if (existingLikesCount === 0) {
        skipped++;
        continue;
      }
      noLikes++;
    }

    batch.update(doc.ref, { likes_count: extracted });
    batchCount++;
    updated++;

    if (batchCount >= BATCH_SIZE) {
      process.stdout.write(`  Committing batch (${updated} updated so far)...\r`);
      await flush();
    }
  }

  await flush();

  console.log('\n--- Migration complete ---');
  console.log(`  Updated:  ${updated}`);
  console.log(`  Skipped (already set): ${skipped}`);
  console.log(`  Set to 0 (no likes found): ${noLikes}`);
  console.log(`  Total:    ${snapshot.size}`);

  process.exit(0);
}

main().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
