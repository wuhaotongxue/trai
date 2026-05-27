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

const files = walk('frontend_next/src/components');
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  content = content.replace(/bg-rose-500/g, 'bg-cyan-500');
  content = content.replace(/bg-rose-600/g, 'bg-cyan-600');
  content = content.replace(/text-rose-500/g, 'text-cyan-500');
  content = content.replace(/text-rose-600/g, 'text-cyan-600');
  
  content = content.replace(/bg-emerald-500/g, 'bg-cyan-500');
  content = content.replace(/bg-emerald-600/g, 'bg-cyan-600');
  content = content.replace(/text-emerald-500/g, 'text-cyan-500');
  content = content.replace(/text-emerald-600/g, 'text-cyan-600');
  
  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log('Replaced colors in:', file);
  }
});
