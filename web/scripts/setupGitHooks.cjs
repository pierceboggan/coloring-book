const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const gitDir = path.join(repoRoot, '.git');

if (!fs.existsSync(gitDir)) {
  console.warn('Git directory not found. Skipping Playwright pre-commit hook installation.');
  process.exit(0);
}

const hooksDir = path.join(gitDir, 'hooks');
fs.mkdirSync(hooksDir, { recursive: true });

const hookPath = path.join(hooksDir, 'pre-commit');
const hookCommand = 'npx --no-install playwright test';
const hookSnippet = [
  '# Run Playwright end-to-end tests before each commit',
  'if ! npx --no-install playwright --version >/dev/null 2>&1; then',
  '  echo "Playwright is not installed. Skipping end-to-end tests."',
  '  exit 0',
  'fi',
  '',
  hookCommand
].join('\n');
const shebang = '#!/bin/sh';

let existingContent = '';
if (fs.existsSync(hookPath)) {
  existingContent = fs.readFileSync(hookPath, 'utf8');
}

let updatedContent = existingContent.replace(/\r\n/g, '\n');

if (!updatedContent.startsWith(shebang)) {
  const trimmed = updatedContent.trimStart();
  updatedContent = `${shebang}\n` + trimmed;
  if (trimmed.length && !trimmed.startsWith('\n')) {
    updatedContent += '\n';
  }
}

const snippetPresent = updatedContent.includes(hookSnippet);
if (!snippetPresent) {
  const lines = updatedContent
    .split('\n')
    .filter((line) => {
      const trimmed = line.trim();
      return trimmed !== hookCommand && trimmed !== '# Run Playwright end-to-end tests before each commit';
    });
  updatedContent = lines.join('\n').replace(/\n{3,}/g, '\n\n').replace(/\s+$/, '');

  if (updatedContent.length > 0 && !updatedContent.endsWith('\n')) {
    updatedContent += '\n';
  }
  updatedContent += `${hookSnippet}\n`;
}

fs.writeFileSync(hookPath, updatedContent, { mode: 0o755 });
fs.chmodSync(hookPath, 0o755);

console.log('Configured git pre-commit hook to run Playwright tests.');
