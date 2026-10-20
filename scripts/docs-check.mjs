import { readFile, stat } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { examplesPath, generateExamples } from './docs-sync.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const documents = [
  'README.md', 'AGENTS.md', 'docs/PRODUCT.md', 'docs/ARCHITECTURE.md',
  'docs/ALGORITHM.md', 'docs/DATA_FORMAT.md', 'docs/EXAMPLES.md',
  '.agents/rules/domain.md', '.agents/rules/code-quality.md', '.agents/rules/ui.md'
];
const failures = [];

for (const relative of documents) {
  const sourcePath = resolve(root, relative);
  let content;
  try {
    content = await readFile(sourcePath, 'utf8');
  } catch {
    failures.push(`Dokument fehlt: ${relative}`);
    continue;
  }
  for (const match of content.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
    const target = match[1].split('#')[0];
    if (!target || /^(https?:|mailto:)/i.test(target)) continue;
    if (target.startsWith('file:')) {
      failures.push(`Nicht portabler Dateiverweis in ${relative}: ${target}`);
      continue;
    }
    try {
      await stat(resolve(dirname(sourcePath), decodeURIComponent(target)));
    } catch {
      failures.push(`Ungültiger Verweis in ${relative}: ${target}`);
    }
  }
}

try {
  const existing = await readFile(examplesPath, 'utf8');
  if (existing !== await generateExamples()) failures.push('docs/EXAMPLES.md ist veraltet; npm run docs:sync ausführen.');
} catch {
  failures.push('docs/EXAMPLES.md konnte nicht geprüft werden.');
}

if (failures.length) {
  for (const failure of failures) process.stderr.write(`${failure}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write('Dokumentation und Verweise sind aktuell.\n');
}
