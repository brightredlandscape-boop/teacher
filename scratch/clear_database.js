import fs from 'fs';
import path from 'path';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const serviceAccountPath = 'c:\\Users\\USER\\Desktop\\EduBridge\\edubridgez-firebase-adminsdk-fbsvc-c5993be1cc.json';
const dataDir = 'c:\\Users\\USER\\Desktop\\EduBridge\\server\\data';

const collections = [
  'platform_config',
  'teachers',
  'users',
  'parents',
  'students',
  'wallets',
  'sessions',
  'assignments',
  'transactions',
  'disputes',
  'reviews',
  'b2b_schools',
  'waitlist'
];

async function clearFirestore() {
  if (!fs.existsSync(serviceAccountPath)) {
    console.error("Firebase service account JSON not found at:", serviceAccountPath);
    return;
  }
  
  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
  
  if (getApps().length === 0) {
    initializeApp({
      credential: cert(serviceAccount)
    });
  }
  
  const db = getFirestore();
  console.log("Connected to Firestore. Clearing collections...");
  
  for (const col of collections) {
    try {
      const snapshot = await db.collection(col).get();
      const batch = db.batch();
      
      let count = 0;
      snapshot.forEach((doc) => {
        batch.delete(doc.ref);
        count++;
      });
      
      if (count > 0) {
        await batch.commit();
        console.log(`Cleared ${count} documents from Firestore collection: '${col}'`);
      } else {
        console.log(`Firestore collection '${col}' is already empty.`);
      }
    } catch (err) {
      console.error(`Error clearing Firestore collection '${col}':`, err.message);
    }
  }
}

function clearLocalJson() {
  console.log("Clearing local JSON backup database files...");
  if (!fs.existsSync(dataDir)) {
    console.log("Local data folder not found.");
    return;
  }
  
  for (const col of collections) {
    const filepath = path.join(dataDir, `${col}.json`);
    try {
      fs.writeFileSync(filepath, JSON.stringify([], null, 2), 'utf8');
      console.log(`Cleared local file: ${col}.json`);
    } catch (err) {
      console.error(`Error clearing local file '${col}.json':`, err.message);
    }
  }
}

async function main() {
  await clearFirestore();
  clearLocalJson();
  console.log("\nDatabase successfully cleared and reset.");
}

main().catch(console.error);
