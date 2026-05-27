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

  content = content.replace(/bg-amber-400/g, 'bg-cyan-400');
  content = content.replace(/bg-amber-500/g, 'bg-cyan-500');
  content = content.replace(/bg-amber-300/g, 'bg-cyan-300');
  content = content.replace(/bg-yellow-400/g, 'bg-cyan-400');
  content = content.replace(/text-amber-400/g, 'text-cyan-400');
  content = content.replace(/text-amber-500/g, 'text-cyan-500');
  content = content.replace(/border-amber-500/g, 'border-cyan-500');

  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log('Replaced amber with cyan in:', file);
  }
});
