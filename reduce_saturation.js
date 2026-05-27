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

  // Reduce background saturation for large blocks
  content = content.replace(/bg-cyan-400/g, 'bg-slate-100');
  content = content.replace(/bg-cyan-500/g, 'bg-slate-200');
  content = content.replace(/bg-cyan-300/g, 'bg-slate-50');
  
  content = content.replace(/bg-emerald-400/g, 'bg-slate-100');
  content = content.replace(/bg-indigo-400/g, 'bg-slate-100');
  content = content.replace(/bg-rose-400/g, 'bg-slate-100');
  content = content.replace(/bg-orange-400/g, 'bg-slate-100');
  
  content = content.replace(/bg-emerald-300/g, 'bg-slate-50');
  content = content.replace(/bg-indigo-300/g, 'bg-slate-50');
  content = content.replace(/bg-rose-300/g, 'bg-slate-50');
  content = content.replace(/bg-orange-300/g, 'bg-slate-50');
  
  // Also reduce border thickness for some elements if they are too heavy
  // content = content.replace(/border-4 border-slate-900/g, 'border-2 border-slate-900');
  
  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log('Reduced saturation in:', file);
  }
});
