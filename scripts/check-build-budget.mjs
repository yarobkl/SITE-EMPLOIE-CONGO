import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const distDir = path.join(root, 'dist');
const htmlPath = path.join(distDir, 'index.html');
const maxEntryBytes = 550 * 1024;
const maxCssBytes = 90 * 1024;

function fail(message) {
  console.error(`\n[performance] ${message}`);
  process.exitCode = 1;
}

if (!fs.existsSync(htmlPath)) {
  fail('dist/index.html est introuvable. Exécutez ce contrôle après vite build.');
} else {
  const html = fs.readFileSync(htmlPath, 'utf8');
  const scriptMatch = html.match(/<script[^>]+src="\/assets\/([^"]+\.js)"/);
  const cssMatch = html.match(/<link[^>]+href="\/assets\/([^"]+\.css)"/);

  if (!scriptMatch) {
    fail('Impossible d’identifier le JavaScript d’entrée dans dist/index.html.');
  } else {
    const entryPath = path.join(distDir, 'assets', scriptMatch[1]);
    const entryBytes = fs.statSync(entryPath).size;
    if (entryBytes > maxEntryBytes) {
      fail(`Le bundle JS initial fait ${(entryBytes / 1024).toFixed(1)} kB, au-dessus du budget de ${maxEntryBytes / 1024} kB.`);
    } else {
      console.log(`[performance] JS initial: ${(entryBytes / 1024).toFixed(1)} kB / ${maxEntryBytes / 1024} kB max.`);
    }
  }

  if (cssMatch) {
    const cssPath = path.join(distDir, 'assets', cssMatch[1]);
    const cssBytes = fs.statSync(cssPath).size;
    if (cssBytes > maxCssBytes) {
      fail(`Le CSS initial fait ${(cssBytes / 1024).toFixed(1)} kB, au-dessus du budget de ${maxCssBytes / 1024} kB.`);
    } else {
      console.log(`[performance] CSS initial: ${(cssBytes / 1024).toFixed(1)} kB / ${maxCssBytes / 1024} kB max.`);
    }
  }
}

if (process.exitCode) process.exit(process.exitCode);
