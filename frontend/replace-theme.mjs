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
  'bg-white': 'bg-surface-card',
  'bg-gray-50': 'bg-surface-hover',
  'bg-[#F8FAFC]': 'bg-surface',
  'text-gray-900': 'text-white',
  'text-gray-800': 'text-slate-300',
  'text-gray-700': 'text-slate-400',
  'text-gray-600': 'text-slate-500',
  'text-gray-500': 'text-slate-500',
  'border-gray-100': 'border-surface-border',
  'border-gray-200': 'border-surface-border',
  'border-gray-300': 'border-slate-700',
  'shadow-gray-200/50': 'shadow-black/50',
  'text-blue-600': 'text-primary',
  'bg-blue-600': 'bg-primary',
  'hover:bg-blue-700': 'hover:bg-primary-dark',
  'from-blue-600': 'from-primary',
  'to-blue-700': 'to-primary-dark',
  'ring-blue-500': 'ring-primary',
  'focus:ring-blue-500': 'focus:ring-primary',
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
