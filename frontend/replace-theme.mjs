import fs from 'fs';
import path from 'path';

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      if(file.endsWith('.jsx')) results.push(file);
    }
  });
  return results;
}

const files = walk('./src');

const replacements = {
  '#0F1117': '#F8FAFC',
  '#161B27': '#FFFFFF',
  '#252D3D': '#E2E8F0',
  '#1E2535': '#F1F5F9',
  '#0C0F18': '#FFFFFF',
  'text-white': 'text-gray-900',
  'text-gray-400': 'text-gray-500',
  'text-gray-300': 'text-gray-700',
  'text-gray-200': 'text-gray-800',
  'bg-black/60': 'bg-gray-900/40',
  'fill="#6B7280"': 'fill="#94A3B8"',
  'border-white/30': 'border-white/30', // keep spinner white
  'border-t-white': 'border-t-white'
};

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // Manually protect spinner classes
  content = content.replace(/border-white\/30/g, 'SPINNER_BORDER');
  content = content.replace(/border-t-white/g, 'SPINNER_T_BORDER');

  for (const [key, value] of Object.entries(replacements)) {
    if (key.includes('SPINNER')) continue;
    content = content.split(key).join(value);
  }

  // Restore spinners
  content = content.replace(/SPINNER_BORDER/g, 'border-white/30');
  content = content.replace(/SPINNER_T_BORDER/g, 'border-t-white');

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated ${file}`);
  }
});
