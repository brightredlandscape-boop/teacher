import fs from 'fs';

const content = fs.readFileSync('src/components/ParentDashboard.jsx', 'utf8');
const lines = content.split('\n');

lines.forEach((line, index) => {
  if (line.includes('grid') || line.includes('flex-row') || line.includes('md:')) {
    if (line.includes('className=')) {
      console.log(`${index + 1}: ${line.trim()}`);
    }
  }
});
