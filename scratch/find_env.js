import fs from 'fs';
import path from 'path';

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const envRefs = [];
  const hardcodedSecrets = [];
  
  lines.forEach((line, index) => {
    if (line.includes('process.env')) {
      envRefs.push({ lineNum: index + 1, content: line.trim() });
    }
    // Check for potential hardcoded API keys or secrets
    if ((/key|secret|token|password|auth/i.test(line)) && !line.includes('process.env') && (line.includes("'") || line.includes('"')) && (line.includes('=') || line.includes(':'))) {
      if (!line.includes('import') && !line.includes('function') && !line.includes('const defaultCreds') && !line.includes('class') && !line.includes('console.log')) {
        hardcodedSecrets.push({ lineNum: index + 1, content: line.trim() });
      }
    }
  });

  return { envRefs, hardcodedSecrets };
}

const serverJsRes = scanFile('server/server.js');
console.log('--- envRefs in server/server.js ---');
console.log(serverJsRes.envRefs);
console.log('--- hardcodedSecrets in server/server.js ---');
serverJsRes.hardcodedSecrets.forEach(s => {
  if (s.content.length < 120) {
    console.log(`${s.lineNum}: ${s.content}`);
  }
});

const payRoutesRes = scanFile('server/routes/payments.js');
console.log('--- envRefs in payments.js ---');
console.log(payRoutesRes.envRefs);
console.log('--- hardcodedSecrets in payments.js ---');
console.log(payRoutesRes.hardcodedSecrets);

const b2bRoutesRes = scanFile('server/routes/b2b.js');
console.log('--- envRefs in b2b.js ---');
console.log(b2bRoutesRes.envRefs);

const emailRes = scanFile('server/services/email.js');
console.log('--- envRefs in email.js ---');
console.log(emailRes.envRefs);
console.log('--- hardcodedSecrets in email.js ---');
console.log(emailRes.hardcodedSecrets);
