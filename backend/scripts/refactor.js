const fs = require('fs');
const path = require('path');

const directory = '/app/src/agent/hermes';

const asyncFuncs = [
  'resolveHermesDomain',
  'hasAutomotiveDomainSignal',
  'classifyHermesSemanticTurn',
  'buildAutomotiveGuidanceReply',
  'buildExternalDomainReply',
  'assessHermesTurn',
  'evaluateHermesConversationalCoherence',
  'synthesizeHermesResponseCandidate',
  'isQaEligibleHermesTurn',
  'buildQaPrimaryReply'
];

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.ts')) results.push(file);
    }
  });
  return results;
}

const files = walk(directory);

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let modified = false;

  for (const func of asyncFuncs) {
    let idx = 0;
    while (true) {
      idx = content.indexOf(func, idx);
      if (idx === -1) break;

      const nextCharIdx = idx + func.length;
      let nextValidCharIdx = nextCharIdx;
      while (nextValidCharIdx < content.length && [' ', '\t', '\n', '\r'].includes(content[nextValidCharIdx])) {
        nextValidCharIdx++;
      }

      if (content[nextValidCharIdx] === '(') {
        const pre = content.slice(0, idx).trimEnd();
        if (pre.endsWith('await') || pre.endsWith('export const') || pre.endsWith('function') || pre.endsWith('import {') || pre.endsWith('import { ') || pre.endsWith(', ') || pre.endsWith(',')) {
          idx = nextValidCharIdx;
          continue;
        }
        
        // Let's also make sure we only replace if it's a call statement, e.g. after `=`, `return`, `{`, etc.
        const lastChar = pre.charAt(pre.length - 1);
        if (['=', ' ', 'n', '(', '{', '[', ':', '\t'].includes(lastChar)) {
          content = content.slice(0, idx) + 'await ' + content.slice(idx);
          modified = true;
          idx += 6 + func.length;
        } else {
          idx = nextValidCharIdx;
        }
      } else {
        idx = nextValidCharIdx;
      }
    }
  }

  // Also replace function declarations to be async
  const exportConsts = [
    'assessHermesTurn',
    'evaluateHermesConversationalCoherence',
    'synthesizeHermesResponseCandidate',
    'isQaEligibleHermesTurn',
    'buildQaPrimaryReply'
  ];
  for (const exp of exportConsts) {
    const decl1 = `export const ${exp} = (`;
    const decl2 = `export const ${exp} = async (`;
    if (content.includes(decl1)) {
      content = content.replace(decl1, decl2);
      modified = true;
    }
  }

  if (modified) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Modified ${file}`);
  }
}
