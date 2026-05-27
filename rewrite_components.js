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

  content = content.replace(/rounded-lg/g, 'rounded-none');
  content = content.replace(/rounded-full/g, 'rounded-none');
  content = content.replace(/rounded-xl/g, 'rounded-none');
  content = content.replace(/rounded-2xl/g, 'rounded-none');
  content = content.replace(/rounded-sm/g, 'rounded-none');
  
  content = content.replace(/shadow-sm/g, 'shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_#ffffff]');
  content = content.replace(/shadow-md/g, 'shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_#ffffff]');
  content = content.replace(/shadow-lg/g, 'shadow-[6px_6px_0px_0px_#0f172a] dark:shadow-[6px_6px_0px_0px_#ffffff]');
  content = content.replace(/shadow-xl/g, 'shadow-[8px_8px_0px_0px_#0f172a] dark:shadow-[8px_8px_0px_0px_#ffffff]');
  
  content = content.replace(/backdrop-blur-sm/g, '');
  content = content.replace(/backdrop-blur/g, '');
  content = content.replace(/backdrop-blur-md/g, '');
  
  content = content.replace(/bg-gradient-to-[a-z]+ from-[a-z0-9-]+ to-[a-z0-9-]+/g, 'bg-amber-400');
  
  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log('Updated components:', file);
  }
});
