import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const DATA_DIR = path.join(process.cwd(), 'server', 'data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Helper to get collection file path
const getFilePath = (collection) => path.join(DATA_DIR, `${collection}.json`);

// Read collection
export function readCollection(collection) {
  const filepath = getFilePath(collection);
  if (!fs.existsSync(filepath)) {
    fs.writeFileSync(filepath, JSON.stringify([], null, 2));
    return [];
  }
  try {
    const content = fs.readFileSync(filepath, 'utf8');
    return JSON.parse(content || '[]');
  } catch (err) {
    console.error(`Error reading collection ${collection}:`, err);
    return [];
  }
}

// Write collection
export function writeCollection(collection, data) {
  const filepath = getFilePath(collection);
  try {
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
    return true;
  } catch (err) {
    console.error(`Error writing collection ${collection}:`, err);
    return false;
  }
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

  insert: (collection, doc) => {
    const data = readCollection(collection);
    const newDoc = {
      id: doc.id || crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...doc
    };
    data.push(newDoc);
    writeCollection(collection, data);
    return newDoc;
  },

  update: (collection, id, updates) => {
    const data = readCollection(collection);
    const index = data.findIndex(item => item.id === id || item.uid === id);
    if (index === -1) return null;

    const updatedDoc = {
      ...data[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    data[index] = updatedDoc;
    writeCollection(collection, data);
    return updatedDoc;
  },

  delete: (collection, id) => {
    const data = readCollection(collection);
    const filtered = data.filter(item => item.id !== id && item.uid !== id);
    writeCollection(collection, filtered);
    return true;
  }
};

// Seed initial data if database is empty
export function seedDatabase() {
  // 1. Seed Platform Config
  const configs = readCollection('platform_config');
  if (configs.length === 0) {
    db.insert('platform_config', {
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
        uid: "teacher_1",
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
        uid: "teacher_2",
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
        uid: "teacher_3",
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
        uid: "teacher_4",
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
        uid: "teacher_5",
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

    initialTeachers.forEach(t => db.insert('teachers', t));
    console.log('Seeded Teachers');
  }

  // 3. Seed Users (Pre-created test profiles)
  const users = readCollection('users');
  if (users.length === 0) {
    // Parent Account
    const parentUser = db.insert('users', {
      uid: "parent_1",
      email: "parent@edubridge.com",
      displayName: "Ngozi Adeleke",
      role: "Parent",
      country: "Nigeria",
      status: "active"
    });
    
    // Seed Parent Details
    db.insert('parents', {
      uid: "parent_1",
      children: ["Tunde", "Yinka"],
      paymentMethods: ["card_visa_1234"],
      preferredCurrency: "NGN",
      notificationPrefs: { email: true, sms: true, push: true },
      referralHits: 12
    });

    // Seed Referred Parent (Converted)
    db.insert('users', {
      uid: "parent_ref_1",
      email: "referred_parent1@edubridge.com",
      displayName: "Sarah Mensah",
      role: "Parent",
      country: "Ghana",
      status: "active"
    });
    db.insert('parents', {
      uid: "parent_ref_1",
      children: ["Kofi"],
      paymentMethods: ["card_visa_9999"],
      preferredCurrency: "GHS",
      referredBy: "parent_1"
    });

    db.insert('users', {
      uid: "parent_ref_2",
      email: "referred_parent2@edubridge.com",
      displayName: "Kofi Boakye",
      role: "Parent",
      country: "Ghana",
      status: "active"
    });
    db.insert('parents', {
      uid: "parent_ref_2",
      children: ["Ama"],
      paymentMethods: ["card_visa_8888"],
      preferredCurrency: "GHS",
      referredBy: "parent_1"
    });

    // Seed Students
    db.insert('students', {
      uid: "student_1",
      parentUid: "parent_1",
      name: "Tunde",
      dob: "2012-05-15",
      subjects: ["Mathematics", "Physics"],
      xp: 400,
      badges: ["Fast Learner"],
      progressBySubject: {
        Mathematics: { attendance: 95, averageScore: 88, completedLessons: 12 }
      }
    });

    db.insert('students', {
      uid: "student_2",
      parentUid: "parent_1",
      name: "Yinka",
      dob: "2014-08-22",
      subjects: ["English", "Literature"],
      xp: 650,
      badges: ["Grammar Guru", "Academic Star"],
      progressBySubject: {
        English: { attendance: 98, averageScore: 92, completedLessons: 16 }
      }
    });

    // Seed Reviews
    db.insert('reviews', {
      sessionId: "session_old_1",
      parentId: "parent_1",
      teacherId: "teacher_1",
      overallRating: 5,
      dimensions: { Punctuality: 5, Quality: 5, Communication: 5, Preparedness: 5, Impact: 5 },
      comment: "Excellent algebra prep. Tunde passed his WAEC with an A1!",
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    });

    // Seed Wallet Balance
    db.insert('wallets', {
      uid: "parent_1",
      balance: 5000000, // ₦50,000 in minor kobo
      escrow: 0
    });

    console.log('Seeded Parent/Student Users & Wallets');
  }

  // 4. Seed Sessions
  const sessions = readCollection('sessions');
  if (sessions.length === 0) {
    db.insert('sessions', {
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

    db.insert('sessions', {
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

    db.insert('sessions', {
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
    
    db.insert('sessions', {
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
    db.insert('assignments', {
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

    db.insert('assignments', {
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

    db.insert('assignments', {
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

    db.insert('assignments', {
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

    db.insert('assignments', {
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
    db.insert('transactions', {
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

    db.insert('transactions', {
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
}
