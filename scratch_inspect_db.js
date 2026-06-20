import { connectDb, db } from './server/db.js';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  await connectDb();
  
  console.log("Teachers before update:");
  console.log(db.find('teachers').map(t => ({ id: t.id, uid: t.uid, username: t.username })));
  
  // Guarantee SEO usernames for seeded teachers
  const teacher_1 = db.findOne('teachers', t => t.uid === 'teacher_1');
  if (teacher_1) {
    console.log("Updating teacher_1...");
    await db.update('teachers', teacher_1.id, { username: "adebayo", status: "verified" });
  }
  const teacher_2 = db.findOne('teachers', t => t.uid === 'teacher_2');
  if (teacher_2) {
    console.log("Updating teacher_2...");
    await db.update('teachers', teacher_2.id, { username: "kofi", status: "verified" });
  }
  const teacher_3 = db.findOne('teachers', t => t.uid === 'teacher_3');
  if (teacher_3) {
    console.log("Updating teacher_3...");
    await db.update('teachers', teacher_3.id, { username: "chioma", status: "verified" });
  }
  const teacher_4 = db.findOne('teachers', t => t.uid === 'teacher_4');
  if (teacher_4) {
    console.log("Updating teacher_4...");
    await db.update('teachers', teacher_4.id, { username: "aminata", status: "verified" });
  }
  const teacher_5 = db.findOne('teachers', t => t.uid === 'teacher_5');
  if (teacher_5) {
    console.log("Updating teacher_5...");
    await db.update('teachers', teacher_5.id, { username: "fatima", status: "verified" });
  }
  
  console.log("Teachers after update:");
  console.log(db.find('teachers').map(t => ({ id: t.id, uid: t.uid, username: t.username })));
  
  process.exit(0);
}

run();
