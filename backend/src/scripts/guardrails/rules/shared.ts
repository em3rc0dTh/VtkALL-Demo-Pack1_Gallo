import { GuardrailViolation, ProjectFile } from '../ruleTypes';
import { importsOf, lineOf } from '../importScanner';

export const sourceFiles = (files: ProjectFile[]) => files.filter((file) => /\.(ts|tsx|js|jsx)$/.test(file.path));

export const violation = (file: string, message: string, evidence?: string, line?: number): GuardrailViolation => ({
  file,
  line,
  message,
  evidence,
});

export const importViolations = (
  file: ProjectFile,
  predicate: (specifier: string) => boolean,
  message: (specifier: string) => string
) =>
  importsOf(file)
    .filter((record) => predicate(record.specifier))
    .map((record) => violation(file.path, message(record.specifier), record.statement, record.line));

export const contentViolations = (
  file: ProjectFile,
  pattern: RegExp,
  message: string
) => {
  const violations: GuardrailViolation[] = [];
  for (const match of file.content.matchAll(new RegExp(pattern.source, pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`))) {
    violations.push(violation(file.path, message, match[0], lineOf(file.content, match.index || 0)));
  }
  return violations;
};

export const isDocumentation = (file: ProjectFile) => file.path.startsWith('docs/');

export const isTestOrFixture = (file: ProjectFile) =>
  /(^|\/)(tests?|fixtures?)(\/|$)/.test(file.path) || file.path.includes('/guardrails/');
