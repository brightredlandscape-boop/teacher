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
  console.warn("Read-only filesystem detected, falling back to /tmp/edubridge_data");
  DATA_DIR = path.join('/tmp', 'edubridge_data');
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
export async function seedDatabase() {
  // 1. Seed Platform Config
  const configs = readCollection('platform_config');
  if (configs.length === 0) {
    await db.insert('platform_config', {
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
    });
    console.log('Seeded Platform Config');
  }

  // 2. Seed Vetted Teachers
  const teachers = readCollection('teachers');
  if (teachers.length === 0) {
    const initialTeachers = [
      {
        id: "teacher_1",
        uid: "teacher_1",
        username: "adebayo",
        status: "verified",
        name: "Mr. Adebayo Okafor",
        location: "Lagos, Nigeria",
        subjects: ["Mathematics", "Physics"],
        curricula: ["WAEC", "JAMB", "IGCSE", "High School (Ages 15-18)", "University Prep"],
        rate: 400000, // ₦4,000/hr in minor units
        rating: 4.9,
        reviewsCount: 247,
        badges: ["badge-verified", "badge-top-rated"],
        bio: "12 years teaching mathematics preparation. Specializes in algebra speed calculations and IGCSE/WAEC exam setups.",
        avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop",
        coverImage: "https://images.unsplash.com/photo-1544717305-2782549b5136?q=80&w=600&auto=format&fit=crop",
        videoUrl: "https://res.cloudinary.com/demo/video/upload/elephants.mp4",
        online: true,
        availability: {
          Tomorrow: ["4:00 PM", "5:00 PM", "6:00 PM"],
          Wednesday: ["3:00 PM", "4:00 PM", "5:00 PM"],
          Thursday: ["2:00 PM", "4:00 PM", "6:00 PM"]
        },
        languages: ["English", "Yoruba"],
        verified: true,
        stats: { sessionsTaught: 540, responseRate: 98 },
        leaderboardOptIn: true
      },
      {
        id: "teacher_2",
        uid: "teacher_2",
        username: "kofi",
        status: "verified",
        name: "Mr. Kofi Mensah",
        location: "Accra, Ghana",
        subjects: ["Chemistry", "Mathematics"],
        curricula: ["WAEC", "Cambridge", "Middle School (Ages 12-14)", "High School (Ages 15-18)"],
        rate: 450000, // ₦4,500/hr
        rating: 4.8,
        reviewsCount: 118,
        badges: ["badge-verified", "badge-fast"],
        bio: "Practical sciences master. Makes complex chemical formulas simple using visual laboratory representations.",
        avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=200&auto=format&fit=crop",
        coverImage: "https://images.unsplash.com/photo-1531482615713-2afd69097998?q=80&w=600&auto=format&fit=crop",
        videoUrl: "https://res.cloudinary.com/demo/video/upload/dog.mp4",
        online: false,
        availability: {
          Tomorrow: ["2:00 PM", "3:00 PM"],
          Wednesday: ["1:00 PM", "2:00 PM"],
          Friday: ["4:00 PM", "5:00 PM"]
        },
        languages: ["English", "Twi"],
        verified: true,
        stats: { sessionsTaught: 280, responseRate: 92 },
        leaderboardOptIn: true
      },
      {
        id: "teacher_3",
        uid: "teacher_3",
        username: "chioma",
        status: "verified",
        name: "Mrs. Chioma Nwachukwu",
        location: "Enugu, Nigeria",
        subjects: ["English", "Literature"],
        curricula: ["WAEC", "Cambridge", "SAT", "Primary (Ages 6-11)", "Middle School (Ages 12-14)"],
        rate: 350000, // ₦3,500/hr
        rating: 5.0,
        reviewsCount: 92,
        badges: ["badge-verified", "badge-elite", "badge-streak"],
        bio: "Creative writing and syntax focus. Multi-jurisdiction English instructor with an emphasis on SAT prep.",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop",
        coverImage: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=600&auto=format&fit=crop",
        videoUrl: "https://res.cloudinary.com/demo/video/upload/elephants.mp4",
        online: true,
        availability: {
          Tomorrow: ["9:00 AM", "10:00 AM", "11:00 AM"],
          Thursday: ["1:00 PM", "2:00 PM", "3:00 PM"]
        },
        languages: ["English", "Igbo"],
        verified: true,
        stats: { sessionsTaught: 195, responseRate: 100 },
        leaderboardOptIn: true
      },
      {
        id: "teacher_4",
        uid: "teacher_4",
        username: "aminata",
        status: "verified",
        name: "Ms. Aminata Diallo",
        location: "Nairobi, Kenya",
        subjects: ["Physics", "Chemistry"],
        curricula: ["IB Diploma", "Cambridge", "Primary (Ages 6-11)", "Middle School (Ages 12-14)"],
        rate: 550000, // ₦5,500/hr
        rating: 4.9,
        reviewsCount: 204,
        badges: ["badge-verified", "badge-top-rated", "badge-intl"],
        bio: "Bilingual instructor specializing in AP, IB, and IGCSE physics frameworks.",
        avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=200&auto=format&fit=crop",
        coverImage: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=600&auto=format&fit=crop",
        online: true,
        availability: {
          Wednesday: ["9:00 AM", "10:00 AM"],
          Friday: ["1:00 PM", "2:00 PM", "3:00 PM"]
        },
        languages: ["English", "French", "Swahili"],
        verified: true,
        stats: { sessionsTaught: 412, responseRate: 97 },
        leaderboardOptIn: true
      },
      {
        id: "teacher_5",
        uid: "teacher_5",
        username: "fatima",
        status: "verified",
        name: "Mrs. Fatima Bello",
        location: "Abuja, Nigeria",
        subjects: ["English", "Mathematics"],
        curricula: ["Nursery (Ages 2-5)", "Primary (Ages 6-11)"],
        rate: 300000, // ₦3,000/hr
        rating: 4.9,
        reviewsCount: 84,
        badges: ["badge-verified", "badge-top-rated"],
        bio: "Early childhood development specialist. Passionate about phonics, foundational numeracy, and active learning strategies for nursery and primary pupils.",
        avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200&auto=format&fit=crop",
        coverImage: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=600&auto=format&fit=crop",
        online: true,
        availability: {
          Tomorrow: ["1:00 PM", "2:00 PM"],
          Thursday: ["10:00 AM", "11:00 AM"]
        },
        languages: ["English", "Hausa"],
        verified: true,
        stats: { sessionsTaught: 130, responseRate: 95 },
        leaderboardOptIn: true
      }
    ];

    for (const t of initialTeachers) {
      await db.insert('teachers', t);
    }
    console.log('Seeded Teachers');
  }

  // 3. Seed Users (Pre-created test profiles)
  const users = readCollection('users');
  if (users.length === 0) {
    // Parent Account
    const parentUser = await db.insert('users', {
      uid: "parent_1",
      email: "parent@edubridge.com",
      displayName: "Ngozi Adeleke",
      role: "Parent",
      country: "Nigeria",
      status: "active"
    });
    
    // Seed Parent Details
    await db.insert('parents', {
      uid: "parent_1",
      children: ["Tunde", "Yinka"],
      paymentMethods: ["card_visa_1234"],
      preferredCurrency: "NGN",
      notificationPrefs: { email: true, sms: true, push: true },
      referralHits: 12
    });

    // Seed Referred Parent (Converted)
    await db.insert('users', {
      uid: "parent_ref_1",
      email: "referred_parent1@edubridge.com",
      displayName: "Sarah Mensah",
      role: "Parent",
      country: "Ghana",
      status: "active"
    });
    await db.insert('parents', {
      uid: "parent_ref_1",
      children: ["Kofi"],
      paymentMethods: ["card_visa_9999"],
      preferredCurrency: "GHS",
      referredBy: "parent_1"
    });

    await db.insert('users', {
      uid: "parent_ref_2",
      email: "referred_parent2@edubridge.com",
      displayName: "Kofi Boakye",
      role: "Parent",
      country: "Ghana",
      status: "active"
    });
    await db.insert('parents', {
      uid: "parent_ref_2",
      children: ["Ama"],
      paymentMethods: ["card_visa_8888"],
      preferredCurrency: "GHS",
      referredBy: "parent_1"
    });

    // Seed Students
    await db.insert('students', {
      uid: "student_1",
      parentUid: "parent_1",
      name: "Tunde",
      dob: "2012-05-15",
      subjects: ["Mathematics", "Physics"],
      xp: 1450,
      badges: ["Perfect Attendance", "Assignment Champion", "Streak Master"],
      progressBySubject: {
        Mathematics: { attendance: 95, averageScore: 88, completedLessons: 12 }
      }
    });

    await db.insert('students', {
      uid: "student_2",
      parentUid: "parent_1",
      name: "Yinka",
      dob: "2014-08-22",
      subjects: ["English", "Literature"],
      xp: 950,
      badges: ["Consistent Learner", "Top Scorer"],
      progressBySubject: {
        English: { attendance: 98, averageScore: 92, completedLessons: 16 }
      }
    });

    // Seed mock students for dynamic study group leaderboard
    await db.insert('students', {
      uid: "student_mock_1",
      parentUid: "parent_other_1",
      name: "Chinedu A.",
      xp: 1980,
      badges: ["Top Leader"],
      progressBySubject: {}
    });
    await db.insert('students', {
      uid: "student_mock_2",
      parentUid: "parent_other_2",
      name: "Zara B.",
      xp: 1720,
      badges: ["Top Scholar"],
      progressBySubject: {}
    });
    await db.insert('students', {
      uid: "student_mock_3",
      parentUid: "parent_other_3",
      name: "Fatima S.",
      xp: 1390,
      badges: ["Top Reader"],
      progressBySubject: {}
    });
    await db.insert('students', {
      uid: "student_mock_4",
      parentUid: "parent_other_4",
      name: "Kofi K.",
      xp: 1210,
      badges: ["Top Writer"],
      progressBySubject: {}
    });

    // Seed Reviews
    await db.insert('reviews', {
      sessionId: "session_old_1",
      parentId: "parent_1",
      teacherId: "teacher_1",
      overallRating: 5,
      dimensions: { Punctuality: 5, Quality: 5, Communication: 5, Preparedness: 5, Impact: 5 },
      comment: "Excellent algebra prep. Tunde passed his WAEC with an A1!",
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    });

    // Seed Wallet Balance
    await db.insert('wallets', {
      uid: "parent_1",
      balance: 0,
      escrow: 0
    });

    console.log('Seeded Parent/Student Users & Wallets');
  }

  // 4. Seed Sessions
  const sessions = readCollection('sessions');
  if (sessions.length === 0) {
    await db.insert('sessions', {
      teacherId: "teacher_1",
      teacherName: "Mr. Adebayo Okafor",
      studentId: "student_1",
      studentName: "Tunde",
      parentId: "parent_1",
      subject: "Mathematics Prep",
      slot: { day: "Tomorrow", time: "4:00 PM" },
      cost: 400000, // ₦4,000 in minor units
      status: "Scheduled",
      clockLog: [],
      recordingConsent: { teacher: true, parent: true }
    });

    await db.insert('sessions', {
      id: "session_old_1",
      teacherId: "teacher_1",
      teacherName: "Mr. Adebayo Okafor",
      studentId: "student_1",
      studentName: "Tunde",
      parentId: "parent_1",
      subject: "Mathematics Prep",
      slot: { day: "Last Week", time: "4:00 PM" },
      cost: 400000,
      status: "Completed",
      clockLog: [{ event: "start", timestamp: new Date(Date.now() - 7*24*3600*1000).toISOString() }, { event: "end", timestamp: new Date(Date.now() - 7*24*3600*1000 + 3600*1000).toISOString() }],
      recordingConsent: { teacher: true, parent: true },
      recordingUrl: "https://res.cloudinary.com/demo/video/upload/dog.mp4"
    });

    await db.insert('sessions', {
      id: "session_old_2",
      teacherId: "teacher_3",
      teacherName: "Mrs. Chioma Nwachukwu",
      studentId: "student_2",
      studentName: "Yinka",
      parentId: "parent_1",
      subject: "English Syntax",
      slot: { day: "3 days ago", time: "2:00 PM" },
      cost: 350000,
      status: "Completed",
      clockLog: [{ event: "start", timestamp: new Date(Date.now() - 3*24*3600*1000).toISOString() }, { event: "end", timestamp: new Date(Date.now() - 3*24*3600*1000 + 3600*1000).toISOString() }],
      recordingConsent: { teacher: true, parent: true },
      recordingUrl: "https://res.cloudinary.com/demo/video/upload/dog.mp4"
    });
    
    await db.insert('sessions', {
      teacherId: "teacher_3",
      teacherName: "Mrs. Chioma Nwachukwu",
      studentId: "student_2",
      studentName: "Yinka",
      parentId: "parent_1",
      subject: "English Literature",
      slot: { day: "Wednesday", time: "3:00 PM" },
      cost: 350000,
      status: "Scheduled",
      clockLog: [],
      recordingConsent: { teacher: true, parent: true }
    });
    console.log('Seeded initial sessions');
  }

  // 5. Seed Grades log
  const assignments = readCollection('assignments');
  if (assignments.length === 0) {
    await db.insert('assignments', {
      studentId: "student_1",
      studentName: "Tunde",
      title: "Homework #3 (Algebraic Fractions)",
      instructions: "Simplify the polynomial equations on page 42.",
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      maxScore: 100,
      status: "Graded",
      submission: { text: "Verified equations submitted." },
      grade: { score: 85, feedback: "Excellent factoring structure. Focus on coefficients next.", date: "3 days ago" }
    });

    await db.insert('assignments', {
      studentId: "student_1",
      studentName: "Tunde",
      title: "Quiz #2 (Simple Linear Equations)",
      instructions: "Complete quiz speed assessment.",
      dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      maxScore: 100,
      status: "Graded",
      submission: { text: "Quiz details submitted." },
      grade: { score: 92, feedback: "Great precision and timeline speed.", date: "5 days ago" }
    });

    await db.insert('assignments', {
      studentId: "student_2",
      studentName: "Yinka",
      title: "Homework #2 (Grammar & Syntax)",
      instructions: "Identify clauses and parts of speech in the sentences.",
      dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      maxScore: 100,
      status: "Graded",
      submission: { text: "Yinka's grammar assignment response." },
      grade: { score: 90, feedback: "Excellent identification of relative clauses.", date: "2 days ago" }
    });

    await db.insert('assignments', {
      studentId: "student_2",
      studentName: "Yinka",
      title: "Homework #1 (Synonyms & Antonyms)",
      instructions: "Find antonyms for the vocabulary list.",
      dueDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
      maxScore: 100,
      status: "Graded",
      submission: { text: "Completed synonym matching sheet." },
      grade: { score: 86, feedback: "Strong vocabulary base, review antonym pairs.", date: "6 days ago" }
    });

    await db.insert('assignments', {
      studentId: "student_2",
      studentName: "Yinka",
      title: "Reading Reflection #1",
      instructions: "Write a 200-word summary of the first chapter of Things Fall Apart.",
      dueDate: "In 2 days",
      maxScore: 100,
      status: "Pending",
      teacherName: "Mrs. Chioma Nwachukwu",
      createdAt: new Date().toISOString()
    });
    console.log('Seeded assignments');
  }

  // 6. Seed Transactions log
  const transactions = readCollection('transactions');
  if (transactions.length === 0) {
    await db.insert('transactions', {
      amount: 400000,
      amountMinorUnits: 400000,
      currency: "NGN",
      commission: 60000,
      status: "settled",
      fromUserId: "parent_1",
      toUserId: "teacher_1",
      sessionId: "session_old_1",
      paymentProcessor: "escrow",
      payoutStatus: "completed"
    });

    await db.insert('transactions', {
      amount: 350000,
      amountMinorUnits: 350000,
      currency: "NGN",
      commission: 52500,
      status: "settled",
      fromUserId: "parent_1",
      toUserId: "teacher_3",
      sessionId: "session_old_2",
      paymentProcessor: "escrow",
      payoutStatus: "completed"
    });
    console.log('Seeded transactions');
  }

  // Seed disputes
  const disputes = readCollection('disputes');
  if (disputes.length === 0) {
    await db.insert('disputes', {
      id: "disp_1",
      sessionId: "session_old_2",
      reason: "Incorrect billing time",
      details: "The tutor registered 15 minutes of excess time after the zoom session crashed.",
      status: "Under Review",
      raisedBy: "parent_1"
    });
    console.log('Seeded disputes');
  }
}
