export type GuardrailViolation = {
  file: string;
  line?: number;
  message: string;
  evidence?: string;
};

export type GuardrailResult = {
  ruleId: string;
  name: string;
  passed: boolean;
  summary: string;
  violations: GuardrailViolation[];
};

export type ProjectFile = {
  path: string;
  content: string;
};

export type GuardrailContext = {
  repoRoot: string;
  files: ProjectFile[];
  getFile: (path: string) => ProjectFile | undefined;
  hasFile: (path: string) => boolean;
};

export type GuardrailRule = {
  id: string;
  name: string;
  run: (context: GuardrailContext) => GuardrailResult;
};

export const pass = (ruleId: string, name: string, summary: string): GuardrailResult => ({
  ruleId,
  name,
  passed: true,
  summary,
  violations: [],
});

export const result = (
  ruleId: string,
  name: string,
  summary: string,
  violations: GuardrailViolation[]
): GuardrailResult => ({
  ruleId,
  name,
  passed: violations.length === 0,
  summary,
  violations,
});
