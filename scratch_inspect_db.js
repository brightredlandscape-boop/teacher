import { connectDb, db } from './server/db.js';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  await connectDb();
  console.log("USERS IN DB:");
  console.log(JSON.stringify(db.find('users'), null, 2));
  console.log("\nTEACHERS IN DB:");
  console.log(JSON.stringify(db.find('teachers'), null, 2));
  process.exit(0);
}

run();
