import { ProjectFile } from './ruleTypes';

export type ImportRecord = {
  specifier: string;
  line: number;
  statement: string;
};

export const lineOf = (content: string, index: number) => content.slice(0, index).split(/\r?\n/).length;

export const importsOf = (file: ProjectFile): ImportRecord[] => {
  const imports: ImportRecord[] = [];
  const importRegex = /import\s+(?:type\s+)?(?:[\s\S]*?\s+from\s+)?['"]([^'"]+)['"]/g;
  const requireRegex = /require\(\s*['"]([^'"]+)['"]\s*\)/g;

  for (const match of file.content.matchAll(importRegex)) {
    imports.push({
      specifier: match[1],
      line: lineOf(file.content, match.index || 0),
      statement: match[0],
    });
  }

  for (const match of file.content.matchAll(requireRegex)) {
    imports.push({
      specifier: match[1],
      line: lineOf(file.content, match.index || 0),
      statement: match[0],
    });
  }

  return imports;
};

export const hasImportMatching = (file: ProjectFile, predicate: (specifier: string) => boolean) =>
  importsOf(file).filter((record) => predicate(record.specifier));
