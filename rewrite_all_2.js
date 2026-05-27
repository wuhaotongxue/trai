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

const files = walk('frontend_next/src/app/admin');
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  content = content.replace(/border-0/g, 'border-4 border-slate-900 dark:border-white');
  content = content.replace(/rounded/g, 'rounded-none');
  
  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log('Updated', file);
  }
});
