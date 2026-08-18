const fs = require('fs');
const path = require('path');

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Backgrounds
  content = content.replace(/bg-\\[#0a0a0a\\]/g, 'bg-gray-50 dark:bg-[#0a0a0a]');
  content = content.replace(/bg-\\[#141414\\]/g, 'bg-white dark:bg-[#141414]');
  content = content.replace(/bg-\\[#1a1a1a\\]/g, 'bg-gray-100 dark:bg-[#1a1a1a]');
  
  // Text colors
  content = content.replace(/text-white(?![/\\w])/g, 'text-gray-900 dark:text-white');
  content = content.replace(/text-gray-100/g, 'text-gray-900 dark:text-gray-100');
  content = content.replace(/text-gray-300/g, 'text-gray-700 dark:text-gray-300');
  content = content.replace(/text-gray-400/g, 'text-gray-600 dark:text-gray-400');
  
  // Borders
  content = content.replace(/border-white\/5(?![\d])/g, 'border-black/5 dark:border-white/5');
  content = content.replace(/border-white\/10/g, 'border-black/10 dark:border-white/10');
  content = content.replace(/border-white\/20/g, 'border-black/20 dark:border-white/20');
  
  // Special backgrounds
  content = content.replace(/bg-white\/10/g, 'bg-black/5 dark:bg-white/10');
  content = content.replace(/bg-white\/5(?![\d])/g, 'bg-black/5 dark:bg-white/5');

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Updated:', filePath);
  }
}

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      replaceInFile(fullPath);
    }
  }
}

processDirectory('./src/components');
replaceInFile('./src/App.tsx');
