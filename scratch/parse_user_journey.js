import fs from 'fs';
try {
  const xml = fs.readFileSync('user_journey_extracted/word/document.xml', 'utf8');
  const regex = /<w:t[^>]*>([\s\S]*?)<\/w:t>/g;
  let match;
  let text = '';
  while ((match = regex.exec(xml)) !== null) {
    text += match[1];
  }
  const formattedText = text.replace(/([.?!])\s*/g, "$1\n\n");
  fs.writeFileSync('scratch/user_journey_clean.txt', formattedText);
  console.log('Extracted user journey text written successfully to scratch/user_journey_clean.txt');
} catch (e) {
  console.error("Failed to parse document.xml:", e.message);
}
