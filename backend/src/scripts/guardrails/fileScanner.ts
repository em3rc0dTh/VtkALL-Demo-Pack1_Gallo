import fs from 'fs';
import path from 'path';
import { GuardrailContext, ProjectFile } from './ruleTypes';

const ignoredSegments = new Set(['node_modules', 'dist', 'coverage', '.next', '.git']);
const textExtensions = new Set(['.ts', '.tsx', '.js', '.jsx', '.json', '.md', '.yml', '.yaml', '.env', '.example']);

const shouldRead = (filePath: string) => {
  const parsed = path.parse(filePath);
  return textExtensions.has(parsed.ext) || parsed.base === '.env.example';
};

const walk = (absolute: string, repoRoot: string): ProjectFile[] => {
  if (!fs.existsSync(absolute)) return [];
  const stat = fs.statSync(absolute);
  if (stat.isFile()) {
    if (!shouldRead(absolute)) return [];
    const relativePath = path.relative(repoRoot, absolute).replace(/\\/g, '/');
    return [{ path: relativePath, content: fs.readFileSync(absolute, 'utf8') }];
  }

  return fs.readdirSync(absolute, { withFileTypes: true }).flatMap((entry) => {
    if (ignoredSegments.has(entry.name)) return [];
    return walk(path.join(absolute, entry.name), repoRoot);
  });
};

export const buildGuardrailContext = (repoRoot: string): GuardrailContext => {
  const roots = [
    'backend/src',
    'backend/docs',
    'frontend',
    'hermes',
    'docs',
    'backend/.env.example',
    'backend/docker-compose.yml',
    'backend/package.json',
  ];
  const files = roots.flatMap((root) => walk(path.join(repoRoot, root), repoRoot));
  const byPath = new Map(files.map((file) => [file.path, file]));

  return {
    repoRoot,
    files,
    getFile: (filePath) => byPath.get(filePath.replace(/\\/g, '/')),
    hasFile: (filePath) => byPath.has(filePath.replace(/\\/g, '/')),
  };
};
