/**
 * Import backfill v4 data into Firestore.
 * Matches creators by name and updates: follower_count, following_count,
 * post_count, likes_count (likes+saves), profile_url.
 *
 * Run: node scripts/import-backfill-v4.mjs
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  const envPath = resolve(__dirname, '../.env.local');
  const raw = readFileSync(envPath, 'utf8');
  const env = {};
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    env[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
  return env;
}

function parseCnNumber(s) {
  const str = String(s ?? '').trim().replace('+', '');
  if (str.includes('万')) return Math.round(parseFloat(str.replace('万', '')) * 10000);
  if (str.toLowerCase().includes('w')) return Math.round(parseFloat(str.toLowerCase().replace('w', '')) * 10000);
  if (str.toLowerCase().includes('k')) return Math.round(parseFloat(str.toLowerCase().replace('k', '')) * 1000);
  const n = parseFloat(str);
  return isNaN(n) ? 0 : Math.round(n);
}

async function main() {
  const env = loadEnv();
  if (!env.FIREBASE_SERVICE_ACCOUNT) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT not found in .env.local');
  }

  const { initializeApp, cert, getApps } = await import('firebase-admin/app');
  const { getFirestore } = await import('firebase-admin/firestore');

  const serviceAccount = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT);
  const app = getApps().length > 0 ? getApps()[0] : initializeApp({ credential: cert(serviceAccount) });
  const firestore = getFirestore(app);

  // Load backfill data
  const mergedPath = resolve(process.env.HOME, 'social-media-crawl-data/backfill-v4/merged.json');
  const backfillData = JSON.parse(readFileSync(mergedPath, 'utf8'));
  const foundCreators = backfillData.filter(c => c.found);
  console.log(`Backfill data: ${backfillData.length} total, ${foundCreators.length} with profile data`);

  // Build lookup by name (lowercase, trimmed)
  const backfillByName = new Map();
  for (const c of foundCreators) {
    backfillByName.set(c.name.toLowerCase().trim(), c);
  }

  // Fetch all Firestore creators
  console.log('Fetching Firestore creators...');
  const snapshot = await firestore.collection('creators').get();
  console.log(`Firestore: ${snapshot.size} creators`);

  let matched = 0;
  let updated = 0;
  const batch = firestore.batch();

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const name = (data.name ?? '').toLowerCase().trim();
    const backfill = backfillByName.get(name);

    if (!backfill) continue;
    matched++;

    const followerCount = backfill.followers_num ?? parseCnNumber(backfill.followers);
    const followingNum = parseCnNumber(backfill.following);
    const likesSavesNum = backfill.likes_saves_num ?? parseCnNumber(backfill.likes_and_saves);

    const updates = {
      follower_count: followerCount,
      following_count: followingNum,
      post_count: backfill.note_count ?? 0,
      likes_count: likesSavesNum,
      likes_and_saves: backfill.likes_and_saves ?? '',
      profile_url: backfill.profile_url ?? data.profile_url,
      platform_id: backfill.user_id ?? data.platform_id,
      updated_at: new Date().toISOString(),
    };

    batch.update(doc.ref, updates);
    updated++;
    console.log(`  ✓ ${data.name}: ${followerCount} followers, ${likesSavesNum} likes+saves`);
  }

  if (updated > 0) {
    await batch.commit();
  }

  console.log(`\n--- Import complete ---`);
  console.log(`  Matched: ${matched}`);
  console.log(`  Updated: ${updated}`);
  console.log(`  Not found in Firestore: ${foundCreators.length - matched}`);

  process.exit(0);
}

main().catch(err => {
  console.error('Import failed:', err);
  process.exit(1);
});
