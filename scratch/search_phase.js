import fs from 'fs';

try {
  const content = fs.readFileSync('srs_text.txt', 'utf8');
  
  // Clean all HTML/XML tags from content to get readable text
  const cleanText = content.replace(/<[^>]+>/g, ' ');
  
  // Let's write the clean text to scratch/srs_clean.txt for easy analysis
  fs.writeFileSync('scratch/srs_clean.txt', cleanText);
  
  // Search for Phase 5 or Elite
  const regex = /phase\s*5/gi;
  let match;
  console.log("=== Phase 5 Matches ===");
  while ((match = regex.exec(cleanText)) !== null) {
    const start = Math.max(0, match.index - 500);
    const end = Math.min(cleanText.length, match.index + 1500);
    console.log(`Match at index ${match.index}:`);
    console.log(cleanText.slice(start, end));
    console.log("----------------------------------------\n");
  }
} catch (e) {
  console.error("Error searching text:", e);
}
