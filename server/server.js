import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { rateLimit } from 'express-rate-limit';
import { getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { db, seedDatabase, connectDb } from './db.js';
import paymentRoutes from './routes/payments.js';
import b2bRoutes from './routes/b2b.js';
import { sendTransactionalEmail } from './services/email.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

let dbInitialized = false;
let dbInitPromise = null;

async function ensureDb() {
  if (dbInitialized) return;
  if (!dbInitPromise) {
    dbInitPromise = (async () => {
      await connectDb();
      await guaranteeInitialProfiles();
      dbInitialized = true;
    })();
  }
  await dbInitPromise;
}

// Database initialization middleware
app.use(async (req, res, next) => {
  try {
    await ensureDb();
    next();
  } catch (err) {
    console.error("Database initialization failed during request:", err);
    res.status(500).json({ error: "Database initialization failed." });
  }
});

// CORS origin security configuration
const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
app.use(cors({
  origin: (origin, callback) => {
    if (
      !origin || 
      origin === clientOrigin || 
      origin === 'http://localhost:5173' || 
      origin.endsWith('.ngrok-free.dev') || 
      origin.endsWith('.ngrok.io') || 
      origin.includes('ngrok-free.dev')
    ) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Configure express.json to capture rawBody for webhook signature verification
app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf.toString();
  }
}));

const JWT_SECRET = process.env.JWT_SECRET || 'edubridge_jwt_secret_2026';

const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: "Too many authentication attempts from this IP, please try again after 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

const supportRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: "Too many support requests from this IP, please try again after 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

const paymentRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: { error: "Too many payment operations from this IP, please try again after 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/payments', paymentRoutes);
app.use('/api/b2b/schools', b2bRoutes);

const pbkdf2Promise = (password, salt, iterations, keylen, digest) => {
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(password, salt, iterations, keylen, digest, (err, derivedKey) => {
      if (err) reject(err);
      else resolve(derivedKey.toString('hex'));
    });
  });
};

// Helper to hash password with PBKDF2 asynchronously (600,000 iterations for SHA-512)
async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = await pbkdf2Promise(password, salt, 600000, 64, 'sha512');
  return { salt, hash };
}

async function verifyPassword(password, salt, storedHash) {
  const hash = await pbkdf2Promise(password, salt, 600000, 64, 'sha512');
  return hash === storedHash;
}

// Generate default credentials for seeded accounts asynchronously
let defaultCreds = null;

async function initDefaultCreds() {
  if (!defaultCreds) {
    defaultCreds = await hashPassword("password123");
  }
}

// Initialize Database & Seed Guarantees
async function guaranteeInitialProfiles() {
  await initDefaultCreds();
  // Guarantee Admin User and Teacher Usernames for Testing
  const adminUser = db.findOne('users', u => u.role === 'Admin');
  if (!adminUser) {
    db.insert('users', {
      uid: "admin_1",
      email: "admin@edubridge.com",
      displayName: "System Admin",
      role: "Admin",
      country: "Nigeria",
      status: "active",
      salt: defaultCreds.salt,
      passwordHash: defaultCreds.hash
    });
    console.log("Guaranteed admin@edubridge.com admin profile.");
  }

  const teacher1User = db.findOne('users', u => u.uid === 'teacher_1');
  if (!teacher1User) {
    db.insert('users', {
      uid: "teacher_1",
      email: "teacher@edubridge.com",
      displayName: "Mr. Adebayo Okafor",
      role: "Teacher",
      country: "Nigeria",
      status: "active",
      salt: defaultCreds.salt,
      passwordHash: defaultCreds.hash
    });
    console.log("Guaranteed teacher@edubridge.com teacher profile.");
  }

  const parent1User = db.findOne('users', u => u.uid === 'parent_1');
  if (!parent1User) {
    db.insert('users', {
      uid: "parent_1",
      email: "parent@edubridge.com",
      displayName: "Ngozi Adeleke",
      role: "Parent",
      country: "Nigeria",
      status: "active",
      salt: defaultCreds.salt,
      passwordHash: defaultCreds.hash
    });
    console.log("Guaranteed parent@edubridge.com parent profile.");
  }

  const student1User = db.findOne('users', u => u.uid === 'student_1');
  if (!student1User) {
    db.insert('users', {
      uid: "student_1",
      email: "student@edubridge.com",
      displayName: "Tunde Okafor",
      role: "Student",
      country: "Nigeria",
      status: "active",
      salt: defaultCreds.salt,
      passwordHash: defaultCreds.hash
    });
    console.log("Guaranteed student@edubridge.com student profile.");
  }

  // Guarantee fresh teacher for onboarding flow testing
  const freshTeacherUser = db.findOne('users', u => u.uid === 'teacher_fresh');
  if (!freshTeacherUser) {
    db.insert('users', {
      uid: "teacher_fresh",
      email: "newteacher@edubridge.com",
      displayName: "Dr. Chidi Johnson",
      role: "Teacher",
      country: "Nigeria",
      status: "active",
      salt: defaultCreds.salt,
      passwordHash: defaultCreds.hash
    });
    db.insert('teachers', {
      uid: "teacher_fresh",
      name: "Dr. Chidi Johnson",
      location: "Enugu, Nigeria",
      subjects: [],
      curricula: [],
      rate: 0,
      rating: 5.0,
      reviewsCount: 0,
      badges: ["badge-verified"],
      bio: "",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop",
      online: true,
      availability: {},
      languages: [],
      verified: false,
      status: "onboarding",
      stats: { sessionsTaught: 0, responseRate: 100 },
      leaderboardOptIn: true
    });
    console.log("Guaranteed newteacher@edubridge.com onboarding testing profile.");
  }

  // Guarantee SEO usernames for seeded teachers
  const teacher_1 = db.findOne('teachers', t => t.uid === 'teacher_1');
  if (teacher_1 && (!teacher_1.username || teacher_1.username !== 'adebayo' || teacher_1.status !== 'verified')) {
    db.update('teachers', teacher_1.uid, { username: "adebayo", status: "verified" });
  }
  const teacher_2 = db.findOne('teachers', t => t.uid === 'teacher_2');
  if (teacher_2 && (!teacher_2.username || teacher_2.username !== 'kofi' || teacher_2.status !== 'verified')) {
    db.update('teachers', teacher_2.uid, { username: "kofi", status: "verified" });
  }
  const teacher_3 = db.findOne('teachers', t => t.uid === 'teacher_3');
  if (teacher_3 && (!teacher_3.username || teacher_3.username !== 'chioma' || teacher_3.status !== 'verified')) {
    db.update('teachers', teacher_3.uid, { username: "chioma", status: "verified" });
  }
  const teacher_4 = db.findOne('teachers', t => t.uid === 'teacher_4');
  if (teacher_4 && (!teacher_4.username || teacher_4.username !== 'aminata' || teacher_4.status !== 'verified')) {
    db.update('teachers', teacher_4.uid, { username: "aminata", status: "verified" });
  }
  const teacher_5 = db.findOne('teachers', t => t.uid === 'teacher_5');
  if (teacher_5 && (!teacher_5.username || teacher_5.username !== 'fatima' || teacher_5.status !== 'verified')) {
    db.update('teachers', teacher_5.uid, { username: "fatima", status: "verified" });
  }
}


// Helper to create notifications
function createNotification(userId, type, title, body) {
  try {
    return db.insert('notifications', {
      userId,
      type,
      title,
      body,
      read: false
    });
  } catch (err) {
    console.error("Failed to create notification:", err);
    return null;
  }
}

// Security Middleware: Verify Firebase ID Token or fallback to JWT
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: "Access token required." });

  // If Firebase Admin is initialized, verify via Firebase Auth
  if (getApps().length > 0) {
    getAuth().verifyIdToken(token)
      .then((decodedToken) => {
        const uid = decodedToken.uid;
        // Lookup user profile in database cache
        const user = db.findOne('users', u => u.uid === uid);
        if (user) {
          req.user = {
            uid: user.uid,
            role: user.role,
            email: user.email,
            displayName: user.displayName
          };
        } else {
          // If profile sync hasn't occurred yet, build basic request context
          req.user = {
            uid: uid,
            role: decodedToken.role || 'Parent',
            email: decodedToken.email
          };
        }
        next();
      })
      .catch((err) => {
        // Fallback to local JWT verification
        jwt.verify(token, JWT_SECRET, (jwtErr, user) => {
          if (jwtErr) {
            return res.status(403).json({ error: "Invalid or expired token." });
          }
          req.user = user;
          next();
        });
      });
  } else {
    // Normal local JWT fallback
    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) return res.status(403).json({ error: "Invalid or expired token." });
      req.user = user;
      next();
    });
  }
}

// Security Middleware: Require Role
function requireRole(roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: "Unauthorized." });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Access forbidden. Insufficient permissions." });
    }
    next();
  };
}

// Security Middleware: Owner Check
function requireOwnerOrAdmin(req, res, next) {
  const requestedUid = req.params.uid || req.body.uid || req.query.uid;
  if (!requestedUid) {
    return res.status(400).json({ error: "User identity parameter is required." });
  }
  if (req.user.role === 'Admin') {
    return next();
  }
  if (req.user.uid !== requestedUid) {
    return res.status(403).json({ error: "Access forbidden. Resource ownership mismatch." });
  }
  next();
}

// Input Sanitizer Helper
function sanitizeText(str) {
  if (typeof str !== 'string') return str;
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

// --- 1. AUTH & USER ENDPOINTS ---

// Register a new user (Parent or Teacher)
app.post('/api/auth/register', authRateLimiter, async (req, res) => {
  const { email, displayName, role, country, password, username: requestedUsername, referredBy, uid: clientUid } = req.body;
  if (!email || !displayName || !role) {
    return res.status(400).json({ error: "Email, display name, and role are required." });
  }

  const sanitizedEmail = sanitizeText(email);
  const sanitizedDisplayName = sanitizeText(displayName);
  const sanitizedCountry = country ? sanitizeText(country) : "Nigeria";

  const existingUser = db.findOne('users', u => u.email.toLowerCase() === sanitizedEmail.toLowerCase());
  if (existingUser) {
    return res.status(400).json({ error: "User with this email already exists." });
  }

  // Use clientUid from Firebase if available, otherwise fallback to mock
  const uid = clientUid || `user_${Date.now()}`;
  let salt = "";
  let hash = "";

  if (password) {
    const pwDetails = await hashPassword(password);
    salt = pwDetails.salt;
    hash = pwDetails.hash;
  }

  const newUser = db.insert('users', {
    uid,
    email: sanitizedEmail,
    displayName: sanitizedDisplayName,
    role,
    country: sanitizedCountry,
    status: "active",
    salt,
    passwordHash: hash
  });

  if (role === "Teacher") {
    let finalUsername = "";
    if (requestedUsername) {
      const cleanUsername = requestedUsername.toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/(^-|-$)/g, '');
      const existingTeacher = db.findOne('teachers', t => t.username === cleanUsername);
      if (existingTeacher) {
        finalUsername = `${cleanUsername}-${Math.floor(Math.random() * 1000)}`;
      } else {
        finalUsername = cleanUsername;
      }
    } else {
      finalUsername = sanitizedDisplayName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `teacher-${Date.now()}`;
    }

    db.insert('teachers', {
      uid,
      username: finalUsername,
      name: sanitizedDisplayName,
      location: sanitizedCountry,
      subjects: [],
      curricula: [],
      rate: 0,
      rating: 5.0,
      reviewsCount: 0,
      badges: ["badge-verified"],
      bio: "",
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200&auto=format&fit=crop",
      coverImage: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=600&auto=format&fit=crop",
      online: true,
      availability: {
        Tomorrow: ["4:00 PM", "5:00 PM"],
        Wednesday: ["3:00 PM", "4:00 PM"]
      },
      languages: ["English"],
      verified: false,
      status: "onboarding",
      stats: { sessionsTaught: 0, responseRate: 100 },
      leaderboardOptIn: true
    });
  } else if (role === "Parent") {
    db.insert('parents', {
      uid,
      children: ["Tunde"], // Default test student
      paymentMethods: ["card_visa_default"],
      preferredCurrency: "NGN",
      country: sanitizedCountry,
      referredBy: referredBy ? sanitizeText(referredBy) : null,
      referralHits: 0
    });

    db.insert('wallets', {
      uid,
      balance: 10000000, // Seed ₦100,000 for local testing
      escrow: 0
    });
  }

  const token = jwt.sign({ uid, role, email: sanitizedEmail }, JWT_SECRET, { expiresIn: '7d' });

  // Trigger transactional Welcome email
  sendTransactionalEmail(sanitizedEmail, "Welcome to EduBridge Africa!", "welcome", {
    displayName: sanitizedDisplayName,
    role
  });

  res.json({ ...newUser, token });
});

// Login user
app.post('/api/auth/login', authRateLimiter, async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  const user = db.findOne('users', u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    return res.status(401).json({ error: "Account not found. Please register." });
  }

  // Securely verify password
  if (user.passwordHash && user.salt) {
    const isMatch = await verifyPassword(password, user.salt, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid password credentials." });
    }
  }

  const token = jwt.sign({ uid: user.uid, role: user.role, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

  res.json({ ...user, token });
});

// POST support agent chatbot message using Gemini AI
app.post('/api/support/message', supportRateLimiter, async (req, res) => {
  const { message, history } = req.body;
  if (!message) {
    return res.status(400).json({ error: "Message is required." });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    // Elegant regex-based local fallback support answers
    let reply = "I'm the EduBridge Support Assistant. I'm here to help you coordinate with vetted teachers, secure escrow payments, or audit lessons. Could you please specify your concern?";
    const msgLower = message.toLowerCase();
    if (msgLower.includes('tutor') || msgLower.includes('teacher') || msgLower.includes('instructor')) {
      reply = "Our teachers undergo government ID checks, credentials handbook verification, and a 4-week onboarding priority audit. You can explore tutors directly on our marketplace.";
    } else if (msgLower.includes('escrow') || msgLower.includes('pay') || msgLower.includes('fee') || msgLower.includes('cost')) {
      reply = "EduBridge operates a timed escrow payment engine. When you book a lesson, funds are secured in escrow and only released to the teacher 24 hours after a class validation check. A 15% commission is kept by the platform.";
    } else if (msgLower.includes('dispute') || msgLower.includes('refund') || msgLower.includes('cancel')) {
      reply = "If a session has an issue, you can file a dispute claim directly from the session log. Escrow funds will remain locked while an admin resolves the claim within 24 hours.";
    } else if (msgLower.includes('language') || msgLower.includes('translate') || msgLower.includes('french') || msgLower.includes('swahili')) {
      reply = "EduBridge provides a multilingual interface supporting English, French, and Swahili. You can switch your preferred language at the top navbar.";
    } else if (msgLower.includes('b2b') || msgLower.includes('school') || msgLower.includes('api')) {
      reply = "We offer robust school B2B APIs for partner academic institutions to request tutor batches and compliance audits programmatically. Generate a B2B API token inside the Admin Portal.";
    }
    return res.json({ reply });
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
    // Map history to Gemini API format
    const contents = [];
    if (history && Array.isArray(history)) {
      history.forEach(h => {
        contents.push({
          role: h.sender === 'user' ? 'user' : 'model',
          parts: [{ text: h.text }]
        });
      });
    }
    contents.push({
      role: 'user',
      parts: [{ text: message }]
    });

    const systemInstruction = {
      parts: [{
        text: "You are the official EduBridge AI Customer Support Agent. You represent EduBridge Africa, an elite tutoring marketplace connecting verified African educators (specializing in WAEC, Cambridge, SAT, and foundational tutoring) with global parent markets. You explain concepts clearly, resolve dispute inquiries gracefully, explain escrow locks (which release 24 hours after a lesson is verified), and explain commission rates (15% commission fee). Maintain a polite, professional, and supportive tone. Keep answers under 100 words."
      }]
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        systemInstruction
      })
    });

    const data = await response.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Thank you for contacting support. I am checking on this for you.";
    res.json({ reply });
  } catch (err) {
    console.error("Gemini support message error:", err);
    res.status(500).json({ error: "Failed to connect to AI support specialist." });
  }
});

// Simulates user account status and fetch
app.get('/api/users/:uid', authenticateToken, requireOwnerOrAdmin, (req, res) => {
  const { uid } = req.params;
  const user = db.findOne('users', u => u.uid === uid || u.id === uid);
  if (!user) {
    return res.status(404).json({ error: "User profile not found." });
  }
  res.json(user);
});


// --- 2. TEACHER ENDPOINTS ---

// GET vetted teachers list with filter supports
app.get('/api/teachers', (req, res) => {
  const { subject, curriculum, rateMax, location } = req.query;
  
  let teachers = db.find('teachers');
  teachers = teachers.filter(t => !t.status || t.status === 'verified');
  
  if (subject) {
    teachers = teachers.filter(t => t.subjects.some(s => s.toLowerCase() === subject.toLowerCase()));
  }
  if (curriculum) {
    teachers = teachers.filter(t => t.curricula.some(c => c.toLowerCase() === curriculum.toLowerCase()));
  }
  if (rateMax) {
    const maxVal = parseInt(rateMax, 10);
    teachers = teachers.filter(t => t.rate <= maxVal);
  }
  if (location) {
    teachers = teachers.filter(t => t.location.toLowerCase().includes(location.toLowerCase()));
  }
  
  res.json(teachers);
});

// GET single teacher public profile
app.get('/api/teachers/:uid', (req, res) => {
  const { uid } = req.params;
  const teacher = db.findOne('teachers', t => t.uid === uid || t.id === uid);
  if (!teacher) {
    return res.status(404).json({ error: "Teacher profile not found." });
  }
  res.json(teacher);
});

// POST optimize bio using Gemini AI
app.post('/api/teachers/optimize-bio', authenticateToken, requireRole(['Teacher']), async (req, res) => {
  const { bio } = req.body;
  if (!bio) {
    return res.status(400).json({ error: "Bio content is required." });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    // Elegant mock response if no API Key is set
    const optimized = `[AI Optimized] Elite Pedagogical Instructor:\n\n${bio}\n\nKey Strengths:\n• Active, student-centric focus mapped to WAEC standards.\n• Emphasizes speed calculations & algebraic logic.\n• Expert in WAEC exam strategies.`;
    return res.json({ optimized });
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `You are an expert profile copywriter for a premium teacher marketplace. Revise and optimize the following teacher bio to sound highly professional, engaging, and trust-building for parents. Keep it under 150 words.\n\nOriginal Bio:\n${bio}`
          }]
        }]
      })
    });

    const data = await response.json();
    const optimized = data.candidates?.[0]?.content?.parts?.[0]?.text || bio;
    res.json({ optimized });
  } catch (err) {
    console.error("Gemini bio optimization error:", err);
    res.status(500).json({ error: "Failed to optimize bio with AI." });
  }
});

// POST Update teacher profile (builder)
app.post('/api/teachers/profile', authenticateToken, requireRole(['Teacher']), requireOwnerOrAdmin, (req, res) => {
  const { uid, name, location, rate, subjects, curricula, languages, bio, avatar } = req.body;
  const teacher = db.findOne('teachers', t => t.uid === uid);
  if (!teacher) {
    return res.status(404).json({ error: "Teacher profile not found." });
  }

  const updated = db.update('teachers', teacher.id, {
    name: name ? sanitizeText(name) : teacher.name,
    location: location ? sanitizeText(location) : teacher.location,
    rate: rate ? parseInt(rate, 10) : teacher.rate,
    subjects: subjects || teacher.subjects,
    curricula: curricula || teacher.curricula,
    languages: languages || teacher.languages,
    bio: bio ? sanitizeText(bio) : teacher.bio,
    avatar: avatar || teacher.avatar
  });

  res.json(updated);
});

// POST waitlist submission
app.post('/api/waitlist', (req, res) => {
  const { email, name, role } = req.body;
  if (!email || !name) {
    return res.status(400).json({ error: "Email and name are required." });
  }
  
  db.insert('waitlist', {
    email: sanitizeText(email),
    name: sanitizeText(name),
    role: role || 'Parent'
  });

  res.json({ success: true, message: "Added to waitlist." });
});


// POST onboarding submissions (Teacher Onboarding)
app.post('/api/teachers/onboard', authenticateToken, requireRole(['Teacher']), requireOwnerOrAdmin, (req, res) => {
  const { uid, name, username: requestedUsername, location, rate, bio, subjects, curricula, languages, availability, videoUrl, avatar, govId, degree } = req.body;
  if (!uid || !name) {
    return res.status(400).json({ error: "Teacher UID and Display Name are required." });
  }

  const teacher = db.findOne('teachers', t => t.uid === uid);
  if (!teacher) {
    return res.status(404).json({ error: "Teacher profile not found." });
  }

  // Handle username selection
  let finalUsername = "";
  if (requestedUsername) {
    const cleanUsername = requestedUsername.toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/(^-|-$)/g, '');
    if (cleanUsername.length < 3) {
      return res.status(400).json({ error: "Username must be at least 3 characters long." });
    }
    const existing = db.findOne('teachers', t => t.username === cleanUsername && t.uid !== uid);
    if (existing) {
      return res.status(400).json({ error: "This username is already taken. Please choose another." });
    }
    finalUsername = cleanUsername;
  } else {
    // Generate unique username based on lowercased name if not provided (fallback)
    let baseUsername = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    finalUsername = baseUsername;
    let counter = 1;
    while (db.findOne('teachers', t => t.username === finalUsername && t.uid !== uid)) {
      finalUsername = `${baseUsername}-${counter}`;
      counter++;
    }
  }

  const updated = db.update('teachers', teacher.id, {
    name: sanitizeText(name),
    username: finalUsername,
    location: location ? sanitizeText(location) : "Nigeria",
    rate: rate ? parseInt(rate, 10) : 0,
    bio: bio ? sanitizeText(bio) : "",
    subjects: subjects || [],
    curricula: curricula || [],
    languages: languages || [],
    availability: availability || {},
    videoUrl: videoUrl || "",
    avatar: avatar || teacher.avatar,
    govId: govId ? sanitizeText(govId) : "",
    degree: degree ? sanitizeText(degree) : "",
    status: "pending_approval", // Submitting onboarding triggers review status
    verified: false
  });

  res.json(updated);
});

// GET all teacher applications (Admin application listings)
app.get('/api/admin/applications', authenticateToken, requireRole(['Admin']), (req, res) => {
  const teachers = db.find('teachers');
  res.json(teachers);
});

// GET all B2B Schools list
app.get('/api/admin/b2b-schools', authenticateToken, requireRole(['Admin']), (req, res) => {
  let schools = db.find('b2b_schools');
  if (schools.length === 0) {
    // Seed default B2B school
    db.insert('b2b_schools', {
      uid: "school_greenwood",
      name: "Greenwood Hall Academy",
      apiKey: "eb_b2b_greenwood_key_2026",
      status: "active",
      registeredStudentsCount: 2
    });
    schools = db.find('b2b_schools');
  }
  res.json(schools);
});

// POST generate new B2B School API Key
app.post('/api/admin/b2b-schools/create', authenticateToken, requireRole(['Admin']), (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ error: "School name is required." });
  }

  const apiKey = `eb_b2b_${name.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_${crypto.randomBytes(4).toString('hex')}`;
  const newSchool = db.insert('b2b_schools', {
    uid: `school_${Date.now()}`,
    name,
    apiKey,
    status: "active",
    registeredStudentsCount: 0
  });

  res.json(newSchool);
});

// POST revoke B2B School API key
app.post('/api/admin/b2b-schools/revoke', authenticateToken, requireRole(['Admin']), (req, res) => {
  const { id } = req.body;
  if (!id) {
    return res.status(400).json({ error: "School identity is required." });
  }

  const updated = db.update('b2b_schools', id, { status: "revoked" });
  res.json(updated);
});

// POST Approve or Reject teacher application (Admin trigger)
app.post('/api/admin/applications/respond', authenticateToken, requireRole(['Admin']), (req, res) => {
  const { teacherUid, action } = req.body;
  if (!teacherUid || !action) {
    return res.status(400).json({ error: "Teacher UID and action are required." });
  }

  const teacher = db.findOne('teachers', t => t.uid === teacherUid);
  if (!teacher) {
    return res.status(404).json({ error: "Teacher profile not found." });
  }

  const status = action === "Approve" ? "verified" : "rejected";
  const verifiedStatus = action === "Approve";

  const updated = db.update('teachers', teacher.id, {
    status,
    verified: verifiedStatus
  });

  // Also update user verification state in users database collection
  const user = db.findOne('users', u => u.uid === teacherUid);
  if (user) {
    db.update('users', user.id, {
      status: action === "Approve" ? "active" : "suspended"
    });
  }

  // Notify teacher of the application outcome
  createNotification(
    teacherUid,
    "application_response",
    action === "Approve" ? "Application Approved!" : "Application Rejected",
    action === "Approve"
      ? "Welcome to EduBridge! Your teacher onboarding profile is approved and live."
      : "Your onboarding application was declined. Please verify your credentials and submit again."
  );

  res.json(updated);
});

// GET teacher by SEO-friendly username
app.get('/api/teachers/by-username/:username', (req, res) => {
  const { username } = req.params;
  // Search strategy:
  // 1. Case-insensitive search for custom username
  // 2. Case-sensitive search for UID or ID (Firestore document IDs are case-sensitive)
  const teacher = db.findOne('teachers', t => 
    (t.username && t.username.toLowerCase() === username.toLowerCase()) ||
    (t.uid === username) ||
    (String(t.id) === username)
  );
  if (!teacher) {
    return res.status(404).json({ error: "Teacher profile not found." });
  }
  res.json(teacher);
});


// --- 3. PARENT & STUDENT ENDPOINTS ---

// GET Parent intelligence dashboard summary
app.get('/api/parents/dashboard/:uid', authenticateToken, requireOwnerOrAdmin, (req, res) => {
  const { uid } = req.params;
  
  const parent = db.findOne('parents', p => p.uid === uid);
  if (!parent) {
    return res.status(404).json({ error: "Parent dashboard not found." });
  }

  const wallet = db.findOne('wallets', w => w.uid === uid);
  const students = db.find('students', s => s.parentUid === uid);
  const studentNames = students.map(s => s.name);
  
  // Find sessions where parent is involved
  const activeSessions = db.find('sessions', s => s.parentId === uid || studentNames.includes(s.studentName));
  const assignments = db.find('assignments', a => studentNames.includes(a.studentName));
  const parentTransactions = db.find('transactions', t => t.fromUserId === uid);
  const parentDisputes = db.find('disputes', d => d.raisedBy === uid);

  // Fetch referrals for this parent
  const referrals = db.find('parents', p => p.referredBy === uid);
  const referralsList = referrals.map(r => {
    const user = db.findOne('users', u => u.uid === r.uid);
    return {
      id: r.uid,
      name: user ? user.displayName : 'Referred Parent',
      date: new Date(parseInt(r.uid.split('_')[1]) || Date.now()).toISOString().split('T')[0],
      status: 'Converted',
      commission: 500000 // ₦5,000 in minor NGN
    };
  });

  const referralStats = {
    hits: parent.referralHits || 0,
    conversions: referrals.length,
    earnings: referrals.length * 500000
  };

  res.json({
    parent,
    walletBalance: wallet ? wallet.balance : 0,
    escrowBalance: wallet ? wallet.escrow : 0,
    students,
    sessions: activeSessions,
    gradesLog: assignments.filter(a => a.status === 'Graded'),
    pendingAssignments: assignments.filter(a => a.status !== 'Graded'),
    transactions: parentTransactions,
    referralsList,
    referralStats,
    disputes: parentDisputes
  });
});

// GET Student dashboard data
app.get('/api/students/dashboard/:uid', authenticateToken, (req, res) => {
  const { uid } = req.params;

  // Find student by UID or by username
  let student = db.findOne('students', s => s.uid === uid);
  if (!student) {
    // Fallback: try by name
    student = db.findOne('students', s => s.name.toLowerCase() === uid.toLowerCase());
  }

  if (!student) {
    return res.status(404).json({ error: "Student dashboard not found." });
  }

  const studentSessions = db.find('sessions', s => s.studentId === student.uid || s.studentName.toLowerCase() === student.name.toLowerCase());
  const assignments = db.find('assignments', a => a.studentId === student.uid || a.studentName.toLowerCase() === student.name.toLowerCase());

  // Return dynamic student leaderboard sorted by XP
  const allStudents = db.find('students');
  const leaderboard = allStudents
    .map((s, idx) => ({
      rank: idx + 1, // Will be computed after sorting
      name: s.name + (s.uid === student.uid ? ' (You)' : ''),
      xp: s.xp || 0,
      active: s.uid === student.uid
    }))
    .sort((a, b) => b.xp - a.xp)
    .map((s, idx) => ({ ...s, rank: idx + 1 }));

  res.json({
    student,
    sessions: studentSessions,
    gradesLog: assignments.filter(a => a.status === 'Graded'),
    pendingAssignments: assignments.filter(a => a.status !== 'Graded'),
    leaderboard
  });
});

// GET Teacher dashboard data
app.get('/api/teachers/dashboard/:uid', authenticateToken, (req, res) => {
  const { uid } = req.params;

  const teacher = db.findOne('teachers', t => t.uid === uid);
  if (!teacher) {
    return res.status(404).json({ error: "Teacher dashboard not found." });
  }

  const teacherSessions = db.find('sessions', s => s.teacherId === uid);
  const teacherAssignments = db.find('assignments', a => a.teacherName === teacher.name || a.studentName === 'Tunde'); // Fallback mock student Tunde

  const wallet = db.findOne('wallets', w => w.uid === uid) || { balance: 0, escrow: 0 };
  const teacherTransactions = db.find('transactions', t => t.toUserId === uid);

  res.json({
    teacher,
    walletBalance: wallet.balance,
    escrowBalance: wallet.escrow,
    sessions: teacherSessions,
    assignments: teacherAssignments,
    transactions: teacherTransactions
  });
});

// POST Parent wallet top-up / add funds
app.post('/api/parents/wallet/topup', authenticateToken, paymentRateLimiter, (req, res) => {
  const { amount, parentId } = req.body;
  if (!amount || amount <= 0) {
    return res.status(400).json({ error: "Invalid topup amount." });
  }

  // Enforce parent ownership check to prevent unauthorized wallet updates
  if (req.user.role !== 'Admin' && req.user.uid !== parentId) {
    return res.status(403).json({ error: "Access forbidden. User identity mismatch." });
  }

  let wallet = db.findOne('wallets', w => w.uid === parentId);
  if (!wallet) {
    const newId = db.insert('wallets', {
      uid: parentId,
      balance: amount,
      escrow: 0
    });
    wallet = db.findOne('wallets', w => w.id === newId);
  } else {
    db.update('wallets', wallet.id, {
      balance: wallet.balance + amount
    });
    wallet = db.findOne('wallets', w => w.id === wallet.id);
  }

  // log a mock transaction
  db.insert('transactions', {
    fromUserId: 'system',
    toUserId: parentId,
    amount: amount,
    type: 'wallet_topup',
    date: new Date().toISOString()
  });

  // add notification
  db.insert('notifications', {
    id: 'notif_' + Date.now(),
    userId: parentId,
    title: 'Wallet Top-up Successful',
    body: `Successfully added funds to your wallet.`,
    read: false,
    type: 'wallet_topup',
    timestamp: new Date().toISOString()
  });

  res.json({
    success: true,
    walletBalance: wallet.balance,
    escrowBalance: wallet.escrow
  });
});

// POST register referral link hit
app.post('/api/parents/referral/hit', (req, res) => {
  const { ref } = req.body;
  if (!ref) {
    return res.status(400).json({ error: "Referral code is required." });
  }

  const parent = db.findOne('parents', p => p.uid === ref);
  if (parent) {
    db.update('parents', parent.id, {
      referralHits: (parent.referralHits || 0) + 1
    });
    return res.json({ success: true, hits: (parent.referralHits || 0) + 1 });
  }
  res.status(404).json({ error: "Parent not found." });
});


// POST submit assignments score
app.post('/api/assignments/grade', authenticateToken, requireRole(['Teacher']), (req, res) => {
  const { id, score, feedback } = req.body;
  const assignment = db.findOne('assignments', a => a.id === id);
  if (!assignment) {
    return res.status(404).json({ error: "Assignment not found." });
  }

  // Verify ownership: Teacher is tutor of session
  if (assignment.teacherId && assignment.teacherId !== req.user.uid) {
    const matchedTeacher = db.findOne('teachers', t => t.uid === req.user.uid);
    if (!matchedTeacher || (assignment.teacherName && assignment.teacherName !== matchedTeacher.name)) {
      return res.status(403).json({ error: "Access forbidden. You are not the teacher of this assignment." });
    }
  }

  const updated = db.update('assignments', id, {
    status: "Graded",
    grade: {
      score: parseInt(score, 10),
      feedback: feedback ? sanitizeText(feedback) : "",
      date: "Just now"
    }
  });

  // Notify parent of graded assignment
  const student = db.findOne('students', s => s.name.toLowerCase() === assignment.studentName.toLowerCase());
  const parentUid = student ? student.parentUid : "parent_1";
  createNotification(
    parentUid,
    "assignment_graded",
    "Assignment Graded",
    `Mr. Adebayo graded ${assignment.studentName}'s assignment: "${assignment.title}". Score: ${score}/100.`
  );

  // Trigger transactional email to parent
  const parentUser = db.findOne('users', u => u.uid === parentUid) || { email: "parent@edubridge.com" };
  sendTransactionalEmail(parentUser.email, "EduBridge: Assignment Graded Card", "assignment_graded", {
    studentName: assignment.studentName,
    title: assignment.title,
    score,
    feedback: feedback || "No comments."
  });

  res.json(updated);
});

// POST create new assignment (Teacher)
app.post('/api/assignments/create', authenticateToken, requireRole(['Teacher']), (req, res) => {
  const { title, description, studentName, dueDate } = req.body;
  if (!title || !studentName) {
    return res.status(400).json({ error: "Title and Student Name are required." });
  }

  const teacher = db.findOne('teachers', t => t.uid === req.user.uid) || { name: "Teacher" };

  const newAssignment = db.insert('assignments', {
    title: sanitizeText(title),
    description: description ? sanitizeText(description) : "",
    teacherId: req.user.uid,
    teacherName: teacher.name,
    studentName,
    dueDate: dueDate || "Next Week",
    status: "Pending",
    createdAt: new Date().toISOString()
  });

  // Notify parent of new homework
  const studentObj = db.findOne('students', s => s.name.toLowerCase() === studentName.toLowerCase());
  const pUid = studentObj ? studentObj.parentUid : "parent_1";
  createNotification(
    pUid,
    "assignment_assigned",
    "New Homework Assigned",
    `A new assignment "${title}" has been set for ${studentName} by ${teacher.name || "Teacher"}.`
  );

  res.json(newAssignment);
});

// POST submit assignment (Student/Parent)
app.post('/api/assignments/submit', authenticateToken, (req, res) => {
  const { id, submissionText } = req.body;
  const assignment = db.findOne('assignments', a => a.id === id);
  if (!assignment) {
    return res.status(404).json({ error: "Assignment not found." });
  }

  // Verify Role: Must be Parent or Student
  if (req.user.role !== 'Parent' && req.user.role !== 'Student') {
    return res.status(403).json({ error: "Access forbidden. Only students or parents can submit homework." });
  }

  const updated = db.update('assignments', id, {
    status: "Submitted",
    submission: sanitizeText(submissionText),
    submittedAt: new Date().toISOString()
  });

  res.json(updated);
});

// --- 4. SESSION BOOKINGS & ESCROW ---

// POST Book a session
app.post('/api/sessions/book', authenticateToken, requireRole(['Parent']), requireOwnerOrAdmin, (req, res) => {
  const { teacherId, teacherName, studentId, studentName, parentId, cost, slot } = req.body;

  // 1. Check Parent wallet
  const wallet = db.findOne('wallets', w => w.uid === parentId);
  if (!wallet || wallet.balance < cost) {
    return res.status(400).json({ error: "Insufficient wallet balance." });
  }

  // 2. Lock escrow balance
  db.update('wallets', wallet.id, {
    balance: wallet.balance - cost,
    escrow: wallet.escrow + cost
  });

  // 3. Create Session Record
  const newSession = db.insert('sessions', {
    teacherId,
    teacherName,
    studentId,
    studentName,
    parentId,
    cost,
    slot,
    status: "Pending Confirmation",
    clockLog: [],
    recordingConsent: { teacher: true, parent: true }
  });

  // 4. Log Transaction
  db.insert('transactions', {
    amount: cost,
    amountMinorUnits: cost,
    currency: "NGN",
    commission: 0,
    status: "secured",
    fromUserId: parentId,
    toUserId: teacherId,
    sessionId: newSession.id,
    paymentProcessor: "escrow",
    payoutStatus: "locked"
  });

  // Dispatch Notifications
  createNotification(
    parentId,
    "booking_secured",
    "Escrow Secured",
    `₦${cost/100} has been locked in escrow for your session with ${teacherName}.`
  );
  createNotification(
    teacherId,
    "booking_received",
    "New Booking Request",
    `You have a new session request from Ngozi Adeleke for Tunde on ${slot.day} at ${slot.time}.`
  );

  // Retrieve parent email to notify
  const parentUser = db.findOne('users', u => u.uid === parentId) || { email: "parent@edubridge.com" };
  sendTransactionalEmail(parentUser.email, "EduBridge: Session Escrow Secured", "booking_secured", {
    teacherName,
    formattedCost: `₦${cost/100}`,
    slot
  });

  res.json({
    session: newSession,
    walletBalance: wallet.balance - cost,
    escrowBalance: wallet.escrow + cost
  });
});

// POST Respond to booking requests (manual confirmation)
app.post('/api/sessions/respond', authenticateToken, requireRole(['Teacher']), (req, res) => {
  const { sessionId, action } = req.body;
  if (!sessionId || !action) {
    return res.status(400).json({ error: "Session ID and action are required." });
  }

  const session = db.findOne('sessions', s => s.id === sessionId);
  if (!session) {
    return res.status(404).json({ error: "Session not found." });
  }

  if (session.teacherId !== req.user.uid) {
    return res.status(403).json({ error: "Access forbidden. You are not the teacher of this session." });
  }

  if (action === "Confirm") {
    const updated = db.update('sessions', session.id, {
      status: "Scheduled"
    });
    createNotification(
      session.parentId,
      "booking_confirmed",
      "Booking Confirmed",
      `Your session with ${session.teacherName} has been confirmed for ${session.slot.day} at ${session.slot.time}.`
    );
    return res.json(updated);
  } else if (action === "Reject") {
    // Release escrow back to parent
    const wallet = db.findOne('wallets', w => w.uid === session.parentId);
    if (wallet) {
      db.update('wallets', wallet.id, {
        balance: wallet.balance + session.cost,
        escrow: Math.max(0, wallet.escrow - session.cost)
      });
    }

    const updated = db.update('sessions', session.id, {
      status: "Rejected"
    });
    createNotification(
      session.parentId,
      "booking_rejected",
      "Booking Declined",
      `Your booking request was declined by ${session.teacherName}. Funds have been refunded to your wallet.`
    );
    return res.json(updated);
  } else {
    return res.status(400).json({ error: "Invalid action. Must be 'Confirm' or 'Reject'." });
  }
});

// GET messages for a session
app.get('/api/messages/:sessionId', authenticateToken, (req, res) => {
  const { sessionId } = req.params;
  const session = db.findOne('sessions', s => s.id === sessionId);
  if (!session) {
    return res.status(404).json({ error: "Session not found." });
  }
  if (session.teacherId !== req.user.uid && session.parentId !== req.user.uid) {
    return res.status(403).json({ error: "Access forbidden. You are not a participant of this class." });
  }
  
  const messages = db.find('messages', m => m.sessionId === sessionId);
  messages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  res.json(messages);
});

// POST send message
app.post('/api/messages', authenticateToken, (req, res) => {
  const { sessionId, senderId, senderName, text } = req.body;
  if (!sessionId || !senderId || !senderName || !text) {
    return res.status(400).json({ error: "Session ID, sender, and text are required." });
  }

  if (senderId !== req.user.uid) {
    return res.status(403).json({ error: "Access forbidden. Sender ID mismatch." });
  }

  const session = db.findOne('sessions', s => s.id === sessionId);
  if (!session) {
    return res.status(404).json({ error: "Session not found." });
  }
  if (session.teacherId !== req.user.uid && session.parentId !== req.user.uid) {
    return res.status(403).json({ error: "Access forbidden. You are not a participant of this class." });
  }

  const newMessage = db.insert('messages', {
    sessionId,
    senderId,
    senderName,
    text: sanitizeText(text)
  });

  // Dispatch Notifications
  const sess = db.findOne('sessions', s => s.id === sessionId);
  if (sess) {
    const recipientId = senderId === sess.teacherId ? sess.parentId : sess.teacherId;
    createNotification(
      recipientId,
      "message_received",
      `New Message from ${senderName}`,
      text.length > 50 ? `${text.substring(0, 50)}...` : text
    );
  }

  res.json(newMessage);
});

// POST Session telemetry / clock events
app.post('/api/sessions/clock', authenticateToken, (req, res) => {
  const { sessionId, eventType, timestamp } = req.body;
  if (!sessionId || !eventType) {
    return res.status(400).json({ error: "Session ID and eventType are required." });
  }

  const session = db.findOne('sessions', s => s.id === sessionId);
  if (!session) {
    return res.status(404).json({ error: "Session record not found." });
  }

  if (session.teacherId !== req.user.uid && session.parentId !== req.user.uid) {
    return res.status(403).json({ error: "Access forbidden. Not a participant." });
  }

  const clockLog = session.clockLog || [];
  clockLog.push({ event: eventType, timestamp: timestamp || new Date().toISOString() });

  const updated = db.update('sessions', sessionId, { clockLog });
  res.json({ success: true, clockLog: updated.clockLog });
});

// POST End session and release escrow
app.post('/api/sessions/end', authenticateToken, requireRole(['Parent']), (req, res) => {
  const { sessionId, rating, comment } = req.body;

  const session = db.findOne('sessions', s => s.id === sessionId);
  if (!session) {
    return res.status(404).json({ error: "Session record not found." });
  }

  if (session.parentId !== req.user.uid) {
    return res.status(403).json({ error: "Access forbidden. You are not the parent of this session." });
  }

  if (session.status === "Completed") {
    return res.status(400).json({ error: "Session is already completed." });
  }

  // 1. Update session status
  db.update('sessions', sessionId, {
    status: "Completed",
    actualEnd: new Date().toISOString()
  });

  // 2. Release Escrow from Parent wallet
  const wallet = db.findOne('wallets', w => w.uid === session.parentId);
  if (wallet) {
    db.update('wallets', wallet.id, {
      escrow: Math.max(0, wallet.escrow - session.cost)
    });
  }

  // 3. Deduct commission (15%) and payout to teacher
  const commission = Math.round(session.cost * 0.15);
  const payout = session.cost - commission;

  createNotification(
    session.parentId,
    "session_completed",
    "Session Completed",
    `Your session with ${session.teacherName} is complete. Billed duration: 58 mins.`
  );

  createNotification(
    session.teacherId,
    "escrow_released",
    "Payout Transferred",
    `Payout of ₦${payout/100} has been released to your wallet (commission: ₦${commission/100}).`
  );

  // Add payout log to transactions
  db.insert('transactions', {
    amount: session.cost,
    amountMinorUnits: session.cost,
    currency: "NGN",
    commission,
    status: "settled",
    fromUserId: session.parentId,
    toUserId: session.teacherId,
    sessionId: session.id,
    paymentProcessor: "payout",
    payoutStatus: "completed"
  });

  // 4. Submit review if rating is supplied
  if (rating) {
    db.insert('reviews', {
      sessionId,
      parentId: session.parentId,
      teacherId: session.teacherId,
      overallRating: rating,
      dimensions: { Punctuality: rating, Quality: rating, Communication: rating, Preparedness: rating, Impact: rating },
      comment: comment ? sanitizeText(comment) : "Session completed successfully.",
      createdAt: new Date().toISOString()
    });

    // Update teacher reviews stats
    const teacher = db.findOne('teachers', t => t.uid === session.teacherId);
    if (teacher) {
      const allReviews = db.find('reviews', r => r.teacherId === session.teacherId);
      const avg = allReviews.reduce((sum, r) => sum + r.overallRating, 0) / allReviews.length;
      db.update('teachers', teacher.id, {
        reviewsCount: allReviews.length,
        rating: parseFloat(avg.toFixed(1))
      });
    }
  }

  res.json({
    status: "Success",
    payoutAmount: payout,
    commissionAmount: commission
  });
});


// --- 6. REPUTATION ENGINE ENDPOINTS ---

// GET /api/leaderboard
app.get('/api/leaderboard', (req, res) => {
  let teachers = db.find('teachers');
  // Sort logic: Higher rating, higher reviewsCount, and badges
  teachers = teachers.map(t => {
    let score = (t.rating * 10) + ((t.reviewsCount || 0) * 5) + ((t.badges || []).length * 15);
    return { ...t, leaderboardScore: score };
  });
  teachers.sort((a, b) => b.leaderboardScore - a.leaderboardScore);
  res.json(teachers.slice(0, 3)); // Return Top 3
});

// GET /api/teachers/:uid/reviews
app.get('/api/teachers/:uid/reviews', (req, res) => {
  const { uid } = req.params;
  const reviews = db.find('reviews', r => r.teacherId === uid);
  // Add some mock 5-dimension reviews if none exist, so the UI can be populated
  if (reviews.length === 0) {
    const mockReviews = [
      {
        id: 'rev_1',
        teacherId: uid,
        parentId: 'parent_1',
        parentName: 'Ngozi A.',
        overallRating: 5,
        dimensions: { Punctuality: 5, Quality: 5, Communication: 4, Preparedness: 5, Impact: 5 },
        comment: 'Fantastic tutor. Helped my child significantly with algebra concepts.',
        createdAt: new Date().toISOString(),
        reply: 'Thank you Ngozi! It was a pleasure teaching Tunde.'
      },
      {
        id: 'rev_2',
        teacherId: uid,
        parentId: 'parent_2',
        parentName: 'David K.',
        overallRating: 4.5,
        dimensions: { Punctuality: 4, Quality: 5, Communication: 5, Preparedness: 4, Impact: 4.5 },
        comment: 'Great session. My daughter really enjoyed the interactive tools.',
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString(), // 2 days ago
      }
    ];
    res.json(mockReviews);
  } else {
    // Mock parent names for real reviews if needed
    res.json(reviews.map(r => ({ ...r, parentName: r.parentName || 'Verified Parent' })));
  }
});

// POST /api/reviews/reply
app.post('/api/reviews/reply', authenticateToken, requireRole(['Teacher']), (req, res) => {
  const { reviewId, replyText } = req.body;
  if (!reviewId || !replyText) return res.status(400).json({ error: "Missing fields" });
  
  const review = db.findOne('reviews', r => r.id === reviewId);
  if (review && review.teacherId !== req.user.uid) {
    return res.status(403).json({ error: "Access forbidden. Review recipient mismatch." });
  }

  if (review) {
    const updated = db.update('reviews', review.id, { reply: sanitizeText(replyText) });
    res.json({ success: true, review: updated });
  } else {
    res.json({ success: true, review: { id: reviewId, reply: sanitizeText(replyText) } });
  }
});


// --- 5. ACADEMY & ELITE TEACHERS ACADEMY ENDPOINTS ---

// POST Enroll in Academy (Subscription Paywall)
app.post('/api/academy/enroll', authenticateToken, requireRole(['Teacher']), (req, res) => {
  const { userId, plan, cardDetails } = req.body;

  if (userId !== req.user.uid) {
    return res.status(403).json({ error: "Access forbidden. User identity mismatch." });
  }

  const teacher = db.findOne('teachers', t => t.uid === userId || t.id === userId);
  if (!teacher) {
    return res.status(404).json({ error: "Teacher profile not found." });
  }

  // Process mock subscription charging
  const subscriptionFee = plan === 'annual' ? 12000000 : 1500000; // ₦120,000 annual or ₦15,000 monthly in minor kobo
  
  // Register enrollment in database
  db.update('teachers', teacher.id, {
    academyEnrolled: true,
    academyPlan: plan,
    academyEnrolledAt: new Date().toISOString()
  });

  // Create an academy ledger notification
  db.insert('notifications', {
    userId,
    title: "Elite Academy Subscription Secured",
    message: `Welcome to the Elite Teachers Academy! Your ${plan === 'annual' ? 'annual' : 'monthly'} subscription was successfully authorized. You now have full access to all 6 modules, interactive quizzes, video courses, discussion forums, and the Gemini roleplay simulator.`,
    read: false,
    createdAt: new Date().toISOString()
  });

  res.json({
    success: true,
    message: "Subscription processed successfully. Welcome to the Elite Teachers Academy!",
    academyEnrolled: true
  });
});

// GET Academy Enrollment & Progress Status
app.get('/api/academy/status/:userId', authenticateToken, requireRole(['Teacher']), (req, res) => {
  const { userId } = req.params;
  if (userId !== req.user.uid) {
    return res.status(403).json({ error: "Access forbidden." });
  }

  const teacher = db.findOne('teachers', t => t.uid === userId || t.id === userId);
  if (!teacher) {
    return res.status(404).json({ error: "Teacher profile not found." });
  }

  const progress = db.find('academy_progress', p => p.userId === userId);
  res.json({
    enrolled: !!teacher.academyEnrolled,
    plan: teacher.academyPlan || null,
    enrolledAt: teacher.academyEnrolledAt || null,
    completedModules: progress.filter(p => p.status === 'Completed').map(p => p.moduleId),
    xp: progress.length * 200
  });
});

// POST Submit module quiz
app.post('/api/academy/submit-quiz', authenticateToken, requireRole(['Teacher']), (req, res) => {
  const { userId, moduleId, answer } = req.body;

  if (userId !== req.user.uid) {
    return res.status(403).json({ error: "Access forbidden. User identity mismatch." });
  }

  const teacher = db.findOne('teachers', t => t.uid === userId || t.id === userId);
  if (!teacher) {
    return res.status(404).json({ error: "Teacher profile not found." });
  }

  if (!teacher.academyEnrolled) {
    return res.status(403).json({ error: "Enrollment required to access course content." });
  }

  // Verification Logic: Option A (0) is the correct answer
  const isCorrect = (parseInt(answer, 10) === 0);

  if (!isCorrect) {
    return res.json({ success: false, message: "Incorrect answer. Review module content and try again." });
  }

  // Save progress
  const progressRecord = db.findOne('academy_progress', p => p.userId === userId && p.moduleId === moduleId);
  if (!progressRecord) {
    db.insert('academy_progress', {
      userId,
      moduleId,
      status: "Completed",
      score: 100,
      completedAt: new Date().toISOString()
    });
  }

  // Update teacher badges & stats
  const allProgress = db.find('academy_progress', p => p.userId === userId && p.status === 'Completed');
  const modulesCompletedCount = allProgress.length;

  let badges = [...(teacher.badges || [])];
  // Check if Elite certified badge needs to be unlocked (after module 6 or all are done)
  if (!badges.includes('badge-ai-cert')) {
    badges.push('badge-ai-cert');
  }

  db.update('teachers', teacher.id, {
    badges
  });

  res.json({
    success: true,
    message: "Correct! +200 XP earned.",
    xpEarned: 200,
    completedCount: modulesCompletedCount
  });
});

// POST Gemini Roleplay Classroom Simulation Endpoint
app.post('/api/academy/roleplay', authenticateToken, requireRole(['Teacher']), async (req, res) => {
  const { scenario, message, history } = req.body;
  if (!scenario || !message) {
    return res.status(400).json({ error: "scenario and message are required." });
  }

  // Scenario description setups
  const personas = {
    classroom_distraction: {
      name: "Chidi",
      role: "Student",
      desc: "A distracted 14-year-old student who keeps playing games on his smartphone during class.",
      systemPrompt: "You are Chidi, a distracted 14-year-old high school student. You are in a tutoring class with your teacher. You are currently looking at your phone playing a mobile game. Respond briefly, defensively or distractedly. You speak in informal teen slang. The teacher is trying to get your attention and keep you engaged. Do not be overly cooperative immediately — make the teacher work to get your interest. Keep replies under 3 sentences."
    },
    parent_conflict: {
      name: "Mrs. Bello",
      role: "Parent",
      desc: "An angry parent whose daughter's quiz grades dropped from 92% to 68%.",
      systemPrompt: "You are Mrs. Bello, an anxious and demanding parent. You paid for tutoring sessions but your daughter's last math quiz grade dropped significantly. You are confronting the tutor. You are skeptical, protective of your daughter, and a bit angry. You want explanations and a concrete plan of action. Keep your tone firm, strict, and parent-like. Keep replies under 3 sentences."
    },
    syllabus_alignment: {
      name: "Principal Mensah",
      role: "Principal",
      desc: "A strict school principal auditing if the tutor's session plans align with the Cambridge and WAEC criteria.",
      systemPrompt: "You are Principal Mensah, a strict, professional school academic auditor. You are vetting the tutor to check if their lesson outline is properly structured and aligned with both Cambridge and WAEC curriculum guidelines. You ask technical questions about lesson structures, assessments, and syllabus code references. Speak formally, professionally, and critically. Keep replies under 3 sentences."
    }
  };

  const persona = personas[scenario] || personas.classroom_distraction;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    // Elegant local fallback dialogue tree responses
    let reply = `[${persona.role} ${persona.name}]: I hear you, teacher. But I'm not really sure if this is relevant to what I want right now.`;
    const msgLower = message.toLowerCase();

    if (scenario === 'classroom_distraction') {
      if (msgLower.includes('phone') || msgLower.includes('put') || msgLower.includes('away') || msgLower.includes('stop')) {
        reply = "[Student Chidi]: Aw, come on, teach! I was just checking a notification. Fine, I'll put it facedown on the desk. What were you saying about the quadratic formula again?";
      } else if (msgLower.includes('game') || msgLower.includes('playing') || msgLower.includes('chidi')) {
        reply = "[Student Chidi]: Bro, this level is so hard though! Fine, fine, I'm locking the screen. I'm listening. Show me how to solve this equation.";
      } else if (msgLower.includes('interesting') || msgLower.includes('fun') || msgLower.includes('active')) {
        reply = "[Student Chidi]: An active worksheet? Like, solving it on the digital board? Okay, that sounds better than just reading slides. I'll join the workspace.";
      }
    } else if (scenario === 'parent_conflict') {
      if (msgLower.includes('sorry') || msgLower.includes('apologize') || msgLower.includes('understand')) {
        reply = "[Parent Mrs. Bello]: I appreciate the apology, but excuses won't get her into university. What specific topics did she fail on, and how will you fix it this week?";
      } else if (msgLower.includes('plan') || msgLower.includes('strategy') || msgLower.includes('drill') || msgLower.includes('practice')) {
        reply = "[Parent Mrs. Bello]: A daily practice drill? Yes, that sounds sensible. She needs structure. Can you send me the scores directly after each session so I can verify?";
      } else if (msgLower.includes('focus') || msgLower.includes('attention') || msgLower.includes('distracted')) {
        reply = "[Parent Mrs. Bello]: Are you saying she isn't paying attention? She is usually very focused. But I will talk to her. Please make sure the lessons are engaging.";
      }
    } else if (scenario === 'syllabus_alignment') {
      if (msgLower.includes('waec') || msgLower.includes('cambridge') || msgLower.includes('syllabus')) {
        reply = "[Principal Mensah]: Excellent. Having exact objective reference marks in your syllabus is critical. Which module units will you cover for the coordinate geometry exam?";
      } else if (msgLower.includes('assessment') || msgLower.includes('test') || msgLower.includes('quiz')) {
        reply = "[Principal Mensah]: A weekly pre-test is good practice. How do you track the student's telemetry progression scores? Is there a progress dashboard?";
      } else if (msgLower.includes('active') || msgLower.includes('notion') || msgLower.includes('classroom')) {
        reply = "[Principal Mensah]: Google Classroom and Notion are acceptable setups. Ensure that assignment links are shared securely and accessible for parent review.";
      }
    }
    return res.json({ reply });
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const contents = [];
    if (history && Array.isArray(history)) {
      history.forEach(h => {
        contents.push({
          role: h.sender === 'user' ? 'user' : 'model',
          parts: [{ text: h.text }]
        });
      });
    }
    contents.push({
      role: 'user',
      parts: [{ text: message }]
    });

    const systemInstruction = {
      parts: [{ text: persona.systemPrompt }]
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents, systemInstruction })
    });

    const data = await response.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || `[${persona.name}]: I'm listening.`;
    res.json({ reply });
  } catch (err) {
    console.error("Gemini roleplay API error:", err);
    res.status(500).json({ error: "Failed to connect to simulation partner." });
  }
});

// GET list forum posts
app.get('/api/academy/forum', (req, res) => {
  const posts = db.find('academy_forum');
  posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(posts);
});

// POST create forum post or comment
app.post('/api/academy/forum', authenticateToken, (req, res) => {
  const { title, content, parentId } = req.body;
  if (!content) {
    return res.status(400).json({ error: "Content is required." });
  }

  if (parentId) {
    const post = db.findOne('academy_forum', p => p.id === parentId);
    if (!post) return res.status(404).json({ error: "Parent post not found." });
    
    const comments = post.comments || [];
    const newComment = {
      id: crypto.randomUUID(),
      authorName: req.user.displayName || "Elite Tutor",
      content,
      createdAt: new Date().toISOString()
    };
    comments.push(newComment);
    db.update('academy_forum', post.id, { comments });
    return res.json({ success: true, post: db.findOne('academy_forum', p => p.id === parentId) });
  }

  if (!title) {
    return res.status(400).json({ error: "Title is required for a new thread." });
  }

  const newPost = db.insert('academy_forum', {
    title,
    content,
    authorName: req.user.displayName || "Elite Tutor",
    authorRole: req.user.role,
    comments: [],
    likes: 0
  });

  res.json({ success: true, post: newPost });
});

// --- 7. NOTIFICATION, DISPUTE & REPORT ENDPOINTS ---

// GET notifications list
app.get('/api/notifications/:uid', authenticateToken, requireOwnerOrAdmin, (req, res) => {
  const { uid } = req.params;
  const list = db.find('notifications', n => n.userId === uid);
  list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(list);
});

// POST Mark notification as read
app.post('/api/notifications/:id/read', authenticateToken, (req, res) => {
  const { id } = req.params;
  const notification = db.findOne('notifications', n => n.id === id);
  if (notification) {
    if (notification.userId !== req.user.uid) {
      return res.status(403).json({ error: "Access forbidden. You do not own this notification." });
    }
    const updated = db.update('notifications', notification.id, { read: true });
    return res.json(updated);
  }
  res.status(404).json({ error: "Notification not found." });
});

// POST Mark all notifications as read
app.post('/api/notifications/read-all/:uid', authenticateToken, requireOwnerOrAdmin, (req, res) => {
  const { uid } = req.params;
  const list = db.find('notifications', n => n.userId === uid && !n.read);
  list.forEach(n => {
    db.update('notifications', n.id, { read: true });
  });
  res.json({ success: true, count: list.length });
});

// POST Create Dispute
app.post('/api/disputes/create', authenticateToken, requireRole(['Parent']), (req, res) => {
  const { sessionId, reason, details } = req.body;
  if (!sessionId || !reason) {
    return res.status(400).json({ error: "sessionId and reason are required." });
  }

  const session = db.findOne('sessions', s => s.id === sessionId);
  if (!session) {
    return res.status(404).json({ error: "Session not found." });
  }

  if (session.parentId !== req.user.uid) {
    return res.status(403).json({ error: "Access forbidden. You are not a participant parent." });
  }

  const transaction = db.findOne('transactions', t => t.sessionId === sessionId);
  if (transaction) {
    db.update('transactions', transaction.id, {
      status: "disputed",
      payoutStatus: "frozen"
    });
  }

  db.update('sessions', session.id, {
    status: "Disputed"
  });

  const dispute = db.insert('disputes', {
    sessionId,
    reason,
    details: details ? sanitizeText(details) : "",
    status: "Open",
    raisedBy: session.parentId
  });

  createNotification(
    session.teacherId,
    "dispute_opened",
    "Dispute Raised on Session",
    `A dispute has been raised for the session on ${session.slot.day} at ${session.slot.time} by the parent. Payout is temporarily frozen.`
  );

  createNotification(
    session.parentId,
    "dispute_opened",
    "Dispute Registered",
    `Your dispute on the session with ${session.teacherName} has been received. Our support team will review within 48 hours.`
  );

  res.json({ success: true, dispute });
});

// GET generate AI cognitive report
app.get('/api/parents/dashboard/:uid/ai-insight', authenticateToken, requireOwnerOrAdmin, async (req, res) => {
  const { uid } = req.params;
  const { studentName } = req.query;

  if (!studentName) {
    return res.status(400).json({ error: "studentName query param is required" });
  }

  const student = db.findOne('students', s => s.parentUid === uid && s.name.toLowerCase() === studentName.toLowerCase());
  const assignments = db.find('assignments', a => a.studentName.toLowerCase() === studentName.toLowerCase());
  const sessions = db.find('sessions', s => s.studentName.toLowerCase() === studentName.toLowerCase());

  const graded = assignments.filter(a => a.status === 'Graded');
  const pending = assignments.filter(a => a.status !== 'Graded');
  const completedSessions = sessions.filter(s => s.status === 'Completed');

  const avgGrade = graded.length > 0
    ? Math.round(graded.reduce((sum, g) => sum + (g.grade?.score || 0), 0) / graded.length)
    : 80;

  const attendanceRate = sessions.length > 0
    ? Math.round((completedSessions.length / sessions.length) * 100)
    : 95;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    const analysis = studentName.toLowerCase() === 'tunde'
      ? `Tunde has shown a significant ${avgGrade - 72}% improvement in mathematical factoring over the past 4 weeks. His homework completion rate is currently at ${Math.round((graded.length / (assignments.length || 1)) * 100)}% with an average assessment score of ${avgGrade}/100. We recommend focusing on trigonometric functions and quadratic coordinates in the next session to solidifying secondary WAEC exam foundations.`
      : `Yinka exhibits a strong grasp of structural grammar and essay punctuation, currently holding a ${avgGrade}/100 average in English Literature. Her attendance rate is a perfect ${attendanceRate}%. To challenge her analytical depth, we recommend that the next session focus on narrative structuring and reading compression strategies.`;

    return res.json({
      insight: analysis,
      timestamp: new Date().toISOString(),
      level: avgGrade >= 90 ? "EXCEPTIONAL" : "HIGH COMPREHENSION",
      avgGrade,
      attendanceRate
    });
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const payload = {
      contents: [{
        parts: [{
          text: `You are an expert pedagogical AI educational analyst. Analyze this student's learning analytics and write a concise, encouraging, and highly specific 3-line diagnostic weekly digest for their parent. Focus on concrete statistics and soft/hard skills.
          
          Student Name: ${studentName}
          Subject Metrics: Average assessment score of ${avgGrade}/100, Attendance rate of ${attendanceRate}%.
          Graded Assignments: ${JSON.stringify(graded.map(g => ({ title: g.title, score: g.grade?.score, feedback: g.grade?.feedback })))}
          Pending Assignments: ${JSON.stringify(pending.map(p => p.title))}
          Completed Sessions: ${completedSessions.length}`
        }]
      }]
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    const insightText = data.candidates?.[0]?.content?.parts?.[0]?.text || "Failed to parse cognitive metrics.";
    
    res.json({
      insight: insightText.trim(),
      timestamp: new Date().toISOString(),
      level: avgGrade >= 90 ? "EXCEPTIONAL" : "HIGH COMPREHENSION",
      avgGrade,
      attendanceRate
    });
  } catch (err) {
    console.error("Gemini dashboard insight error:", err);
    res.status(500).json({ error: "Failed to generate AI weekly insight." });
  }
});

// GET HTML progress report download representation
app.get('/api/reports/download/:studentId', authenticateToken, (req, res) => {
  const { studentId } = req.params;
  const student = db.findOne('students', s => s.uid === studentId || s.id === studentId);
  if (!student) {
    return res.status(404).send("Student profile not found.");
  }

  if (req.user.role !== 'Admin' && student.parentUid !== req.user.uid) {
    return res.status(403).send("Access forbidden. Not the parent of this student.");
  }

  const parent = db.findOne('parents', p => p.uid === student.parentUid);
  const parentUser = db.findOne('users', u => u.uid === student.parentUid);
  const assignments = db.find('assignments', a => a.studentName.toLowerCase() === student.name.toLowerCase());
  const sessions = db.find('sessions', s => s.studentName.toLowerCase() === student.name.toLowerCase());
  
  const graded = assignments.filter(a => a.status === 'Graded');
  const completed = sessions.filter(s => s.status === 'Completed');
  
  const avgScore = graded.length > 0
    ? Math.round(graded.reduce((sum, g) => sum + (g.grade?.score || 0), 0) / graded.length)
    : 80;

  const attendance = sessions.length > 0
    ? Math.round((completed.length / sessions.length) * 100)
    : 100;

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>EduBridge Progress Report - ${student.name}</title>
      <style>
        body { font-family: 'Inter', system-ui, sans-serif; background: #FAF8F5; color: #1A1A1A; padding: 40px; margin: 0; }
        .card { max-width: 800px; margin: 0 auto; background: #FFF; border: 1px solid #2E4036; border-radius: 24px; padding: 40px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); }
        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #2E4036; padding-bottom: 20px; }
        .logo { font-size: 24px; font-weight: 800; color: #2E4036; text-transform: uppercase; font-family: 'Space Grotesk', sans-serif; }
        .title { font-size: 18px; color: #CC5833; font-weight: bold; }
        .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 30px 0; }
        .meta-item { background: #F2F0E9; padding: 15px 20px; border-radius: 12px; }
        .meta-label { font-size: 10px; text-transform: uppercase; color: #666; font-weight: bold; margin-bottom: 5px; }
        .meta-value { font-size: 16px; font-weight: bold; color: #2E4036; }
        .stats-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin-bottom: 40px; }
        .stat-card { text-align: center; border: 1px solid #E2E8F0; border-radius: 16px; padding: 20px; }
        .stat-val { font-size: 32px; font-weight: 800; color: #CC5833; }
        .stat-lbl { font-size: 11px; text-transform: uppercase; color: #666; margin-top: 5px; }
        .section-title { font-size: 16px; font-weight: bold; color: #2E4036; border-bottom: 1px solid #E2E8F0; padding-bottom: 10px; margin-bottom: 20px; text-transform: uppercase; }
        .grade-row { display: flex; justify-content: space-between; align-items: center; padding: 12px 15px; background: #FFF; border: 1px solid #F2F0E9; border-radius: 8px; margin-bottom: 10px; }
        .grade-score { background: #2E4036; color: #FFF; font-weight: bold; padding: 6px 12px; border-radius: 6px; font-size: 14px; }
        .footer { text-align: center; margin-top: 30px; border-top: 1px solid #E2E8F0; padding-top: 20px; font-size: 10px; color: #666; }
        @media print {
          body { background: #FFF; padding: 0; }
          .card { border: none; box-shadow: none; padding: 0; }
        }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <div class="logo">EduBridge Africa</div>
          <div class="title">Official Progress Report</div>
        </div>
        
        <div class="meta-grid">
          <div class="meta-item">
            <div class="meta-label">STUDENT NAME</div>
            <div class="meta-value">${student.name}</div>
          </div>
          <div class="meta-item">
            <div class="meta-label">PARENT / GUARDIAN</div>
            <div class="meta-value">${parentUser ? parentUser.displayName : "Ngozi Adeleke"}</div>
          </div>
        </div>

        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-val">${avgScore}%</div>
            <div class="stat-lbl">Average Grade</div>
          </div>
          <div class="stat-card">
            <div class="stat-val">${attendance}%</div>
            <div class="stat-lbl">Attendance Rate</div>
          </div>
          <div class="stat-card">
            <div class="stat-val">${student.xp}</div>
            <div class="stat-lbl">Earned Student XP</div>
          </div>
        </div>

        <div class="section-title">Assignment History</div>
        ${graded.map(g => `
          <div class="grade-row">
            <div>
              <div style="font-weight: bold; font-size: 13px;">${g.title}</div>
              <div style="font-size: 11px; color: #666; font-style: italic; margin-top: 3px;">"${g.grade?.feedback || ''}"</div>
            </div>
            <div class="grade-score">${g.grade?.score}/100</div>
          </div>
        `).join('')}

        <div class="section-title">AI Academic Insights</div>
        <div style="background: #F2F0E9; border-left: 4px solid #CC5833; padding: 15px; font-size: 13px; line-height: 1.6; border-radius: 0 12px 12px 0; font-style: italic;">
          "${student.name} exhibits excellent comprehension marks with ${avgScore}% overall assessment quality. They demonstrate high aptitude in logic parameters and structured completion rates. Recommended next curriculum topics: Advanced exercises and comprehensive reviews."
        </div>

        <div class="footer">
          Generated on ${new Date().toLocaleDateString()} · Official EduBridge Academic Registry Record.
        </div>
      </div>
    </body>
    </html>
  `;

  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});

// App initialization status check
app.get('/api/status', (req, res) => {
  res.json({ status: "healthy", version: "2.0.0", message: "EduBridge API Server Active." });
});

// Start Server conditionally (only when not running inside Vercel serverless environment)
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  ensureDb().then(() => {
    app.listen(PORT, () => {
      console.log(`EduBridge Africa Backend Server running on http://localhost:${PORT}`);
    });
  }).catch(err => {
    console.error("Database initialization failed, starting server with fallback...", err);
    app.listen(PORT, () => {
      console.log(`EduBridge Africa Backend Server running on http://localhost:${PORT} (failed init fallback)`);
    });
  });
}

export default app;
