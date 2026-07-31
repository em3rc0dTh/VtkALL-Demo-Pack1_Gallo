import assert from 'assert';
import fs from 'fs';
import path from 'path';

const auditPath = path.resolve(__dirname, '../../../../../docs/reviews/HERMES_06A_SCHEDULING_CONTRACT_AUDIT.md');
const reportPath = path.resolve(__dirname, '../../../../../docs/reviews/HERMES_06A_SCHEDULING_CONTRACT_DRY_RUN_REPORT.md');

const requiredAuditTerms = [
  'CURRENT SCHEDULING FLOW',
  'AUTHORITATIVE SERVICES',
  'TEMPORAL WORKFLOW',
  'SELECTED H06B BOUNDARY',
  'sequenceDiagram',
];

const requiredReportTerms = [
  'DRY-RUN RESULTS',
  'ZERO-EFFECTS RESULTS',
  'GUARDRAILS',
  'REGRESSION RESULTS',
];

const run = async () => {
  assert(fs.existsSync(auditPath), 'Audit report is missing.');
  assert(fs.existsSync(reportPath), 'Dry-run report is missing.');

  const audit = fs.readFileSync(auditPath, 'utf8');
  const report = fs.readFileSync(reportPath, 'utf8');

  for (const term of requiredAuditTerms) assert(audit.includes(term), `Audit report missing section: ${term}`);
  for (const term of requiredReportTerms) assert(report.includes(term), `Dry-run report missing section: ${term}`);

  console.log('h06a-audit: PASS');
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
