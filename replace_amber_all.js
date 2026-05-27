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

  content = content.replace(/amber-100/g, 'cyan-100');
  content = content.replace(/amber-200/g, 'cyan-200');
  content = content.replace(/amber-300/g, 'cyan-300');
  content = content.replace(/amber-400/g, 'cyan-400');
  content = content.replace(/amber-500/g, 'cyan-500');
  content = content.replace(/amber-600/g, 'cyan-600');
  content = content.replace(/amber-700/g, 'cyan-700');
  content = content.replace(/amber-800/g, 'cyan-800');
  content = content.replace(/amber-900/g, 'cyan-900');
  
  content = content.replace(/yellow-100/g, 'cyan-100');
  content = content.replace(/yellow-200/g, 'cyan-200');
  content = content.replace(/yellow-300/g, 'cyan-300');
  content = content.replace(/yellow-400/g, 'cyan-400');
  content = content.replace(/yellow-500/g, 'cyan-500');
  content = content.replace(/yellow-600/g, 'cyan-600');
  content = content.replace(/yellow-700/g, 'cyan-700');
  content = content.replace(/yellow-800/g, 'cyan-800');
  content = content.replace(/yellow-900/g, 'cyan-900');

  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log('Replaced amber/yellow with cyan in:', file);
  }
});
