const fs = require('fs');
const path = require('path');
const file = 'frontend_next/src/app/admin/(main)/page.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/rounded-lg/g, 'rounded-none');
content = content.replace(/rounded-full/g, 'rounded-none');
content = content.replace(/rounded-xl/g, 'rounded-none');
content = content.replace(/rounded-2xl/g, 'rounded-none');
content = content.replace(/rounded-sm/g, 'rounded-none');
content = content.replace(/rounded/g, 'rounded-none');

content = content.replace(/shadow-sm/g, 'shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_#ffffff]');
content = content.replace(/shadow-md/g, 'shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_#ffffff]');
content = content.replace(/shadow-lg/g, 'shadow-[6px_6px_0px_0px_#0f172a] dark:shadow-[6px_6px_0px_0px_#ffffff]');
content = content.replace(/hover:shadow-md/g, 'hover:shadow-[6px_6px_0px_0px_#0f172a] dark:hover:shadow-[6px_6px_0px_0px_#ffffff]');

content = content.replace(/border-0/g, 'border-4 border-slate-900 dark:border-white');
content = content.replace(/border /g, 'border-2 border-slate-900 dark:border-white ');
content = content.replace(/border-b /g, 'border-b-4 border-slate-900 dark:border-white ');

content = content.replace(/bg-gradient-to-r from-blue-600 to-indigo-600/g, 'bg-indigo-400');
content = content.replace(/bg-gradient-to-[a-z]+ [a-z0-9-/ ]+/g, 'bg-amber-400 border-b-4 border-slate-900');

content = content.replace(/backdrop-blur-sm/g, '');
content = content.replace(/backdrop-blur/g, '');

content = content.replace(/text-muted-foreground/g, 'text-slate-900 dark:text-white font-bold uppercase');
content = content.replace(/bg-card\/[0-9]+/g, 'bg-white dark:bg-slate-900');
content = content.replace(/bg-card/g, 'bg-white dark:bg-slate-900');

content = content.replace(/text-sm font-semibold/g, 'text-2xl font-black uppercase');
content = content.replace(/text-2xl font-bold/g, 'text-4xl font-black uppercase tracking-widest');

content = content.replace(/hover:-translate-y-0.5/g, 'hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_0px_#0f172a] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all');

fs.writeFileSync(file, content);
