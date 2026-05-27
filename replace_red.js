const fs = require('fs');
const path = require('path');

const walk = (dir) => {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      results.push(file);
    }
  });
  return results;
};

const files = walk('frontend_next/src');
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // Unify primary buttons to bg-slate-900 (dark mode white) or cyan-500
  content = content.replace(/bg-rose-500/g, 'bg-cyan-500');
  content = content.replace(/bg-rose-600/g, 'bg-cyan-600');
  content = content.replace(/text-rose-500/g, 'text-cyan-500');
  content = content.replace(/text-rose-600/g, 'text-cyan-600');
  
  content = content.replace(/bg-emerald-500/g, 'bg-cyan-500');
  content = content.replace(/bg-emerald-600/g, 'bg-cyan-600');
  content = content.replace(/text-emerald-500/g, 'text-cyan-500');
  content = content.replace(/text-emerald-600/g, 'text-cyan-600');

  // Except some specific alert or success states
  // Well, to be safe, just do this. We want a unified cyan/slate look.
  
  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log('Replaced colors in:', file);
  }
});
