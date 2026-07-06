const fs = require('fs');
const path = require('path');
const root = path.resolve('D:/backup/shopprime-html');
const react = path.resolve('D:/OneDrive/Desktop/shopprime-react/src');
const htmlClasses = new Set();
for (const file of fs.readdirSync(root).filter(f => f.endsWith('.html'))) {
  const text = fs.readFileSync(path.join(root, file), 'utf8');
  for (const match of text.matchAll(/class\s*=\s*"([^"]+)"/g)) {
    match[1].split(/\s+/).forEach((cls) => { if (cls) htmlClasses.add(cls); });
  }
}
const reactClasses = new Set();
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (full.endsWith('.tsx') || full.endsWith('.ts')) {
      const text = fs.readFileSync(full, 'utf8');
      for (const match of text.matchAll(/className\s*=\s*"([^"]+)"/g)) {
        match[1].split(/\s+/).forEach((cls) => { if (cls) reactClasses.add(cls); });
      }
      for (const match of text.matchAll(/className\s*=\s*\{`([^`]+)`\}/g)) {
        match[1].split(/\s+/).forEach((cls) => { if (cls) reactClasses.add(cls); });
      }
      for (const match of text.matchAll(/className\s*=\s*\{\s*"([^"]+)"\s*\}/g)) {
        match[1].split(/\s+/).forEach((cls) => { if (cls) reactClasses.add(cls); });
      }
    }
  }
}
walk(react);
const missing = [...htmlClasses].filter((c) => !reactClasses.has(c)).sort();
console.log('backup html classes:', htmlClasses.size);
console.log('react classes:', reactClasses.size);
console.log('missing count:', missing.length);
console.log(missing.join('\n'));
