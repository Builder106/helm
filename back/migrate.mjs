import fs from 'fs/promises';
import path from 'path';

const srcDir = '../front/src/components';
const destDir = './views/partials';

await fs.mkdir(destDir, { recursive: true });

const files = await fs.readdir(srcDir);

for (const file of files) {
  if (!file.endsWith('.tsx')) continue;
  let content = await fs.readFile(path.join(srcDir, file), 'utf-8');
  
  // Basic replacements
  content = content.replace(/className=/g, 'class=');
  content = content.replace(/import .*? from .*?;\n/g, '');
  content = content.replace(/export function (\w+)\(.*?\).*?{/g, '<!-- Component: $1 -->');
  
  // Replace fragments
  content = content.replace(/<>/g, '');
  content = content.replace(/<\/>/g, '');
  
  const destFile = path.join(destDir, file.replace('.tsx', '.ejs'));
  await fs.writeFile(destFile, content);
}
console.log('Migration initial pass done.');
