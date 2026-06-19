import express from 'express';
import { db } from '../db.js';

const router = express.Router();

// Middleware: Authenticate B2B School API Key
function authenticateB2BSchool(req, res, next) {
  const apiKey = req.headers['x-b2b-api-key'];
  if (!apiKey) {
    return res.status(401).json({ error: "B2B API authentication key is required in 'x-b2b-api-key' header." });
  }

  // Check if API key exists in platform B2B school configurations
  const school = db.findOne('b2b_schools', s => s.apiKey === apiKey);
  if (!school) {
    return res.status(403).json({ error: "Invalid B2B school API key." });
  }

  req.school = school;
  next();
}

/**
 * GET list of vetted teachers matching school B2B filters (Subject, Rate limits)
 * URL: http://localhost:5000/api/b2b/schools/tutors
 */
router.get('/tutors', authenticateB2BSchool, (req, res) => {
  const { subject, maxRate } = req.query;
  let teachers = db.find('teachers', t => t.verified && t.status === 'verified');

  if (subject) {
    teachers = teachers.filter(t => t.subjects.some(s => s.toLowerCase() === subject.toLowerCase()));
  }
  if (maxRate) {
    const rateLimit = parseInt(maxRate, 10);
    teachers = teachers.filter(t => t.rate <= rateLimit);
  }

  res.json({
    school: req.school.name,
    tutorsFoundCount: teachers.length,
    tutors: teachers.map(t => ({
      uid: t.uid,
      name: t.name,
      location: t.location,
      subjects: t.subjects,
      ratePerHour: t.rate,
      rating: t.rating,
      languages: t.languages
    }))
  });
});

/**
 * POST register a batch of students programmatically
 * URL: http://localhost:5000/api/b2b/schools/register-bulk-students
 */
router.post('/register-bulk-students', authenticateB2BSchool, async (req, res) => {
  const { students } = req.body; // Array of { name, dob, subjects }
  if (!students || !Array.isArray(students)) {
    return res.status(400).json({ error: "Missing or invalid students list batch array in request body." });
  }

  const createdStudents = [];
  for (const s of students) {
    const studentRecord = await db.insert('students', {
      parentUid: req.school.uid, // mapped to the school's account uid
      name: s.name,
      dob: s.dob || "2013-01-01",
      subjects: s.subjects || [],
      xp: 0,
      badges: ["B2B Enrolled"],
      schoolB2B: req.school.name
    });
    createdStudents.push(studentRecord);
  }

  res.json({
    school: req.school.name,
    bulkCountRegistered: createdStudents.length,
    registeredStudents: createdStudents
  });
});

/**
 * GET compliance sessions and escrow timesheets
 * URL: http://localhost:5000/api/b2b/schools/compliance
 */
router.get('/compliance', authenticateB2BSchool, (req, res) => {
  // Find all sessions involving students registered by this school
  const students = db.find('students', s => s.parentUid === req.school.uid);
  const studentNames = students.map(s => s.name);

  const sessions = db.find('sessions', s => studentNames.includes(s.studentName));

  res.json({
    school: req.school.name,
    totalSessionsAudited: sessions.length,
    audits: sessions.map(s => ({
      sessionId: s.id,
      studentName: s.studentName,
      teacherName: s.teacherName,
      subject: s.subject || "General Tutoring",
      costNgnMinor: s.cost,
      status: s.status,
      slot: s.slot,
      clockedSeconds: s.clockLog ? s.clockLog.length * 60 : 3600 // mock durations
    }))
  });
});

export default router;
