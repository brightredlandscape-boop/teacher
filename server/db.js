import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

let DATA_DIR = path.join(process.cwd(), 'server', 'data');

// Ensure data directory exists (robust fallback to /tmp for read-only environments)
try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
} catch (err) {
  console.warn("Read-only filesystem detected, falling back to /tmp/eduvista_data");
  DATA_DIR = path.join('/tmp', 'eduvista_data');
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (tmpErr) {
    console.error("Failed to create temp directory as well:", tmpErr);
  }
}

// Helper to get collection file path
const getFilePath = (collection) => path.join(DATA_DIR, `${collection}.json`);

// In-memory collection cache
const CACHE = {};
let isMongo = false;
let isFirestore = false;
let firestoreDb = null;

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
  'b2b_schools'
];

// Schema-free dynamic collection models
const collectionSchema = new mongoose.Schema({}, { strict: false, timestamps: true });
const getModel = (collectionName) => {
  const modelName = collectionName.charAt(0).toUpperCase() + collectionName.slice(1);
  return mongoose.models[modelName] || mongoose.model(modelName, collectionSchema, collectionName);
};

// Encryption parameters
const algorithm = 'aes-256-cbc';
const encryptionKeyString = process.env.DB_ENCRYPTION_KEY || process.env.JWT_SECRET || 'fallback_default_encryption_key_2026';
const ENCRYPTION_KEY = crypto.createHash('sha256').update(encryptionKeyString).digest();

// Encrypt plain text using AES-256-CBC
function encrypt(text) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

// Decrypt cipher text using AES-256-CBC
function decrypt(encryptedText) {
  const parts = encryptedText.split(':');
  if (parts.length !== 2) {
    throw new Error('Invalid encrypted text format');
  }
  const iv = Buffer.from(parts[0], 'hex');
  const encrypted = parts[1];
  const decipher = crypto.createDecipheriv(algorithm, ENCRYPTION_KEY, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// Load fallback collections from JSON files
function loadFromJsonFiles() {
  for (const col of collections) {
    const filepath = getFilePath(col);
    if (!fs.existsSync(filepath)) {
      // Write empty collection array encrypted
      const emptyEncrypted = encrypt(JSON.stringify([], null, 2));
      try {
        fs.writeFileSync(filepath, emptyEncrypted, 'utf8');
      } catch (err) {
        console.error(`Database Migration: Failed to write initial fallback JSON for '${col}':`, err.message);
      }
      CACHE[col] = [];
    } else {
      try {
        const content = fs.readFileSync(filepath, 'utf8').trim();
        if (!content) {
          CACHE[col] = [];
          continue;
        }

        const isEncrypted = content.includes(':') && !content.startsWith('[');
        if (isEncrypted) {
          const decrypted = decrypt(content);
          CACHE[col] = JSON.parse(decrypted || '[]');
        } else {
          // Backward-compatible plain text auto-migration
          console.log(`Database Migration: Auto-migrating plain-text collection '${col}' to encrypted-at-rest...`);
          CACHE[col] = JSON.parse(content || '[]');
          writeCollectionToFile(col); // Converts to encrypted format on disk
        }
      } catch (err) {
        console.error(`Database Migration: Error reading fallback collection ${col}:`, err);
        CACHE[col] = [];
      }
    }
  }
}

// Write collection cache to local JSON file fallback
function writeCollectionToFile(collection) {
  const filepath = getFilePath(collection);
  try {
    const jsonStr = JSON.stringify(CACHE[collection] || [], null, 2);
    const encryptedData = encrypt(jsonStr);
    fs.writeFileSync(filepath, encryptedData, 'utf8');
    return true;
  } catch (err) {
    console.error(`Database Migration: Error writing fallback JSON for ${collection}:`, err);
    return false;
  }
}

// Persist document operations to Firestore, MongoDB or Local JSON Files
async function persistDocumentInsert(collection, doc) {
  if (isFirestore) {
    try {
      const docId = doc.id || doc.uid || crypto.randomUUID();
      await firestoreDb.collection(collection).doc(docId).set(doc);
    } catch (err) {
      console.error(`Database Migration: Error inserting into Firestore [${collection}]:`, err);
    }
  } else if (isMongo) {
    try {
      const Model = getModel(collection);
      await Model.create(doc);
    } catch (err) {
      console.error(`Database Migration: Error inserting into MongoDB [${collection}]:`, err);
    }
  } else {
    writeCollectionToFile(collection);
  }
}

async function persistDocumentUpdate(collection, id, doc) {
  if (isFirestore) {
    try {
      await firestoreDb.collection(collection).doc(id).set(doc, { merge: true });
    } catch (err) {
      console.error(`Database Migration: Error updating Firestore [${collection}]:`, err);
    }
  } else if (isMongo) {
    try {
      const Model = getModel(collection);
      const selector = { $or: [{ id }, { uid: id }] };
      await Model.replaceOne(selector, doc, { upsert: true });
    } catch (err) {
      console.error(`Database Migration: Error updating MongoDB [${collection}]:`, err);
    }
  } else {
    writeCollectionToFile(collection);
  }
}

async function persistDocumentDelete(collection, id) {
  if (isFirestore) {
    try {
      await firestoreDb.collection(collection).doc(id).delete();
    } catch (err) {
      console.error(`Database Migration: Error deleting from Firestore [${collection}]:`, err);
    }
  } else if (isMongo) {
    try {
      const Model = getModel(collection);
      const selector = { $or: [{ id }, { uid: id }] };
      await Model.deleteOne(selector);
    } catch (err) {
      console.error(`Database Migration: Error deleting from MongoDB [${collection}]:`, err);
    }
  } else {
    writeCollectionToFile(collection);
  }
}

function initFirestore() {
  // Dynamically find any Firebase service account JSON file in the project root
  let serviceAccountPath = null;
  try {
    const files = fs.readdirSync(process.cwd());
    const serviceAccountFile = files.find(f => f.startsWith('edubridgez-firebase-adminsdk-') && f.endsWith('.json'));
    if (serviceAccountFile) {
      serviceAccountPath = path.join(process.cwd(), serviceAccountFile);
      console.log(`Database Migration: Found Firebase service account key file: ${serviceAccountFile}`);
    }
  } catch (err) {
    console.warn("Failed to dynamically search for firebase service account:", err);
  }

  if (!serviceAccountPath) {
    serviceAccountPath = path.join(process.cwd(), 'edubridgez-firebase-adminsdk-fbsvc-d56360976c.json');
  }
  
  if (fs.existsSync(serviceAccountPath)) {
    try {
      const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
      initializeApp({
        credential: cert(serviceAccount)
      });
      firestoreDb = getFirestore();
      isFirestore = true;
      console.log("Database Migration: Connected to Cloud Firestore successfully using local service account JSON.");
      return;
    } catch (err) {
      console.error("Database Migration: Failed to initialize using local service account JSON:", err);
    }
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY 
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') 
    : null;

  if (projectId && clientEmail && privateKey) {
    try {
      initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        })
      });
      firestoreDb = getFirestore();
      isFirestore = true;
      console.log("Database Migration: Connected to Cloud Firestore successfully.");
    } catch (err) {
      console.error("Database Migration: Failed to initialize Firebase Admin cert:", err);
    }
  } else if (projectId) {
    try {
      initializeApp();
      firestoreDb = getFirestore();
      isFirestore = true;
      console.log("Database Migration: Connected to Firestore using default credentials.");
    } catch (err) {
      console.error("Database Migration: Failed to initialize default Firebase Admin:", err);
    }
  }
}

// Initialize and connect database
export async function connectDb() {
  // Try to connect to Firestore first if variables are configured
  initFirestore();

  if (isFirestore) {
    try {
      // Load all collections into cache
      for (const col of collections) {
        const snapshot = await firestoreDb.collection(col).get();
        const docs = [];
        snapshot.forEach(doc => {
          docs.push({ id: doc.id, ...doc.data() });
        });
        CACHE[col] = docs;
        console.log(`Database Migration: Loaded ${CACHE[col].length} documents for collection '${col}' from Firestore.`);
      }
    } catch (err) {
      console.error("Database Migration: Firestore loading failed, falling back to local JSON database:", err);
      isFirestore = false;
      loadFromJsonFiles();
    }
  } else {
    const uri = process.env.MONGODB_URI;
    if (uri) {
      console.log("Database Migration: Connecting to production MongoDB...");
      try {
        await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
        isMongo = true;
        console.log("Database Migration: Connected to MongoDB successfully.");
        
        // Load all collections into cache
        for (const col of collections) {
          const Model = getModel(col);
          const docs = await Model.find({}).lean();
          CACHE[col] = docs.map(d => {
            const { _id, __v, ...cleanDoc } = d;
            if (!cleanDoc.id) {
              cleanDoc.id = cleanDoc.uid || String(_id);
            }
            return cleanDoc;
          });
          console.log(`Database Migration: Loaded ${CACHE[col].length} documents for collection '${col}' from MongoDB.`);
        }
      } catch (err) {
        console.error("Database Migration: MongoDB connection failed, falling back to local JSON database:", err);
        isMongo = false;
        loadFromJsonFiles();
      }
    } else {
      console.log("Database Migration: No Firestore or MongoDB configured, running local JSON database fallback.");
      isMongo = false;
      loadFromJsonFiles();
    }
  }

  // Seed the database after collections are loaded in memory
  await seedDatabase();
}

// Read collection
export function readCollection(collection) {
  if (!CACHE[collection]) {
    CACHE[collection] = [];
  }
  return CACHE[collection];
}

// Overwrite collection
export function writeCollection(collection, data) {
  CACHE[collection] = data;
  if (isFirestore) {
    const colRef = firestoreDb.collection(collection);
    colRef.get().then(snapshot => {
      const batch = firestoreDb.batch();
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      data.forEach(item => {
        const docId = item.id || item.uid || crypto.randomUUID();
        batch.set(colRef.doc(docId), item);
      });
      return batch.commit();
    }).then(() => {
      console.log(`Database Migration: Overwrote Firestore collection ${collection} successfully.`);
    }).catch(err => {
      console.error(`Database Migration: Error overwriting Firestore collection ${collection}:`, err);
    });
  } else if (isMongo) {
    const Model = getModel(collection);
    Model.deleteMany({})
      .then(() => {
        if (data.length > 0) {
          return Model.insertMany(data);
        }
      })
      .catch(err => {
        console.error(`Database Migration: Error overwriting MongoDB collection ${collection}:`, err);
      });
  } else {
    writeCollectionToFile(collection);
  }
  return true;
}

// Database Actions
export const db = {
  find: (collection, filterFn = () => true) => {
    const data = readCollection(collection);
    return data.filter(filterFn);
  },

  findOne: (collection, filterFn) => {
    const data = readCollection(collection);
    return data.find(filterFn) || null;
  },

  insert: async (collection, doc) => {
    const data = readCollection(collection);
    const newDoc = {
      id: doc.id || doc.uid || crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...doc
    };
    data.push(newDoc);
    await persistDocumentInsert(collection, newDoc);
    return newDoc;
  },

  update: async (collection, id, updates) => {
    const data = readCollection(collection);
    const index = data.findIndex(item => item.id === id || item.uid === id);
    if (index === -1) return null;

    const updatedDoc = {
      ...data[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    data[index] = updatedDoc;
    await persistDocumentUpdate(collection, id, updatedDoc);
    return updatedDoc;
  },

  delete: async (collection, id) => {
    const data = readCollection(collection);
    const index = data.findIndex(item => item.id === id || item.uid === id);
    if (index === -1) return false;

    data.splice(index, 1);
    await persistDocumentDelete(collection, id);
    return true;
  }
};

// Seed initial data if database is empty
// Seed initial data for live site
export async function seedDatabase() {
  // Force reset data directories and files to 0 metrics for live site
  const collectionsToWipe = ['sessions', 'assignments', 'transactions', 'disputes', 'reviews'];
  for (const col of collectionsToWipe) {
    CACHE[col] = [];
    const filepath = getFilePath(col);
    try {
      const emptyEncrypted = encrypt(JSON.stringify([], null, 2));
      fs.writeFileSync(filepath, emptyEncrypted, 'utf8');
    } catch (err) {
      console.error(`Wiping collection '${col}' failed:`, err.message);
    }
  }

  // 1. Seed Platform Config
  const filepathConfig = getFilePath('platform_config');
  const defaultConfigs = [
    {
      id: 'default',
      commissionRate: 15,
      minPayoutNGN: 500000, // ₦5,000 in minor kobo
      minPayoutUSD: 2000,   // $20 in minor cents
      exchangeRates: {
        NGN_USD: 0.00125,
        NGN_GBP: 0.001,
        NGN_EUR: 0.00116,
        NGN_GHS: 0.0143,
        NGN_CAD: 0.00172
      }
    }
  ];
  CACHE['platform_config'] = defaultConfigs;
  try {
    const enc = encrypt(JSON.stringify(defaultConfigs, null, 2));
    fs.writeFileSync(filepathConfig, enc, 'utf8');
  } catch (err) {
    console.error('Failed to write platform_config:', err.message);
  }

  // 2. Seed Clean Users (Only Admin, default parent, and default student with 0 balances)
  const defaultUsers = [
    {
      uid: "admin_1",
      email: "admin@eduvista.com",
      displayName: "System Admin",
      role: "Admin",
      country: "Nigeria",
      status: "active",
      salt: "d56360976c",
      passwordHash: "8b7e28a506bb8029d2f2d93e17cd3626be0cd776fa2e7d704ba44dfb8d80f8cd" // password123
    },
    {
      uid: "admin_zeero",
      email: "zeerocodes@gmail.com",
      displayName: "Zeerocodes Admin",
      role: "Admin",
      country: "Nigeria",
      status: "active",
      salt: "d56360976c",
      passwordHash: "8b7e28a506bb8029d2f2d93e17cd3626be0cd776fa2e7d704ba44dfb8d80f8cd"
    },
    {
      uid: "parent_1",
      email: "parent@eduvista.com",
      displayName: "Ngozi Adeleke",
      role: "Parent",
      country: "Nigeria",
      status: "active",
      salt: "d56360976c",
      passwordHash: "8b7e28a506bb8029d2f2d93e17cd3626be0cd776fa2e7d704ba44dfb8d80f8cd"
    },
    {
      uid: "student_1",
      email: "student@eduvista.com",
      displayName: "Tunde Okafor",
      role: "Student",
      country: "Nigeria",
      status: "active",
      salt: "d56360976c",
      passwordHash: "8b7e28a506bb8029d2f2d93e17cd3626be0cd776fa2e7d704ba44dfb8d80f8cd"
    }
  ];

  CACHE['users'] = defaultUsers;
  try {
    const enc = encrypt(JSON.stringify(defaultUsers, null, 2));
    fs.writeFileSync(getFilePath('users'), enc, 'utf8');
  } catch (err) {
    console.error('Failed to write users:', err.message);
  }

  // Seed Parents
  const defaultParents = [
    {
      uid: "parent_1",
      children: ["Tunde"],
      paymentMethods: ["card_visa_1234"],
      preferredCurrency: "NGN",
      country: "Nigeria",
      referralHits: 0
    }
  ];
  CACHE['parents'] = defaultParents;
  try {
    const enc = encrypt(JSON.stringify(defaultParents, null, 2));
    fs.writeFileSync(getFilePath('parents'), enc, 'utf8');
  } catch (err) {
    console.error('Failed to write parents:', err.message);
  }

  // Seed Students
  const defaultStudents = [
    {
      uid: "student_1",
      parentUid: "parent_1",
      name: "Tunde",
      dob: "2015-05-15",
      subjects: ["Mathematics"],
      xp: 0,
      badges: [],
      progressBySubject: {}
    }
  ];
  CACHE['students'] = defaultStudents;
  try {
    const enc = encrypt(JSON.stringify(defaultStudents, null, 2));
    fs.writeFileSync(getFilePath('students'), enc, 'utf8');
  } catch (err) {
    console.error('Failed to write students:', err.message);
  }

  // Seed Wallets (All initialized to 0)
  const defaultWallets = [
    { uid: "admin_1", balance: 0, escrow: 0 },
    { uid: "admin_zeero", balance: 0, escrow: 0 },
    { uid: "parent_1", balance: 0, escrow: 0 }
  ];
  CACHE['wallets'] = defaultWallets;
  try {
    const enc = encrypt(JSON.stringify(defaultWallets, null, 2));
    fs.writeFileSync(getFilePath('wallets'), enc, 'utf8');
  } catch (err) {
    console.error('Failed to write wallets:', err.message);
  }

  // Seed B2B Schools
  const defaultB2BSchools = [
    {
      id: "default_school",
      name: "Vanguard Academy",
      email: "b2b@vanguard.edu.ng",
      status: "active",
      token: "sch_vanguard_2026_token_sec",
      createdAt: new Date().toISOString()
    }
  ];
  CACHE['b2b_schools'] = defaultB2BSchools;
  try {
    const enc = encrypt(JSON.stringify(defaultB2BSchools, null, 2));
    fs.writeFileSync(getFilePath('b2b_schools'), enc, 'utf8');
  } catch (err) {
    console.error('Failed to write B2B schools:', err.message);
  }

  console.log("Database successfully seed-wiped and reset to 0 metrics for production deployment.");
}
