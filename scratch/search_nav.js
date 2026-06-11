import fs from 'fs';

const content = fs.readFileSync('src/App.jsx', 'utf8');
const lines = content.split('\n');

lines.forEach((line, index) => {
  if (line.includes('navSandbox') || line.includes('navPortals') || line.includes('navVetting') ||
      line.includes('Sandbox') || line.includes('Portals') || line.includes('Vetting')) {
    if (line.includes('<a') || line.includes('t(') || line.includes('button') || line.includes('li>')) {
      console.log(`${index + 1}: ${line.trim()}`);
    }
  }
});
