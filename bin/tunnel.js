#!/usr/bin/env node
import { exec } from 'child_process';

console.log("=================================================================");
console.log("                 EDUBRIDGE WEB SHARING SUITE                     ");
console.log("=================================================================");
console.log("Expose the local development environment using secure tunnels.");
console.log("\n[Option A] Expose Frontend (Vite on Port 5173):");
console.log("  npx localtunnel --port 5173");
console.log("\n[Option B] Expose Backend API (Express on Port 5000):");
console.log("  npx localtunnel --port 5000");
console.log("\n[Option C] Expose via ngrok:");
console.log("  ngrok http 5173");
console.log("-----------------------------------------------------------------");
console.log("Attempting to spawn an automatic localtunnel process on Port 5173...");
console.log("-----------------------------------------------------------------");

const tunnelProc = exec('npx localtunnel --port 5173');

tunnelProc.stdout.on('data', (data) => {
  console.log("[tunnel-log]:", data.trim());
});

tunnelProc.stderr.on('data', (data) => {
  console.warn("[tunnel-warning]:", data.trim());
});

tunnelProc.on('error', (err) => {
  console.error("[tunnel-error]: Local tunnel failed to boot.", err.message);
  console.log("\nAlternative: please execute `npx localtunnel --port 5173` manually.");
});

// Allow user to press Ctrl+C to terminate
process.on('SIGINT', () => {
  console.log("\nTerminating tunnel connection.");
  tunnelProc.kill();
  process.exit();
});
