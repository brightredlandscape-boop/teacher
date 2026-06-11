import fs from 'fs';
try {
  const xml = fs.readFileSync('srs_extracted/word/document.xml', 'utf8');
  const regex = /<w:t[^>]*>([\s\S]*?)<\/w:t>/g;
  let match;
  let text = '';
  while ((match = regex.exec(xml)) !== null) {
    text += match[1];
  }
  // Replace spacing/formatting indicators
  const formattedText = text.replace(/([.?!])\s*/g, "$1\n\n");
  fs.writeFileSync('srs_text.txt', formattedText);
  console.log('Extracted text written successfully to srs_text.txt');
} catch (e) {
  console.error("Failed to parse document.xml:", e.message);
}
