import assert from 'node:assert/strict';
import { LANDING_BLOCK_TYPES } from '../../services/landing/landing.contracts';
import { demoTestLandingSeed, landingSeeds, turaguaLandingSeed } from '../../services/landing/landing.seed';
import { assertLandingContent } from '../../services/landing/landing.validation';

const requiredTypes = [
  'hero',
  'catalog',
  'stats',
  'about',
  'gallery',
  'testimonials',
  'promotion',
  'call_to_action',
  'contact',
  'agent_call_to_action',
  'structured_content',
  'footer',
];

for (const type of requiredTypes) {
  assert.ok(LANDING_BLOCK_TYPES.includes(type as any), `Missing landing block type: ${type}`);
}

for (const seed of landingSeeds) {
  assert.equal(seed.status, 'published');
  assert.ok(seed.published, `${seed.businessSlug} seed must publish an initial snapshot`);
  assert.deepEqual(assertLandingContent(seed.draft), seed.draft);
  assert.deepEqual(assertLandingContent(seed.published), seed.published);
}

assert.equal(landingSeeds.length, 2);
assert.ok(landingSeeds.some((seed) => seed.businessSlug === 'demo_test'));
assert.ok(landingSeeds.some((seed) => seed.businessSlug === 'turagua'));
assert.ok(demoTestLandingSeed.blocks.some((block) => block.type === 'agent_call_to_action'));
assert.ok(turaguaLandingSeed.blocks.some((block) => block.type === 'catalog'));
assert.ok(turaguaLandingSeed.blocks.every((block) => LANDING_BLOCK_TYPES.includes(block.type)));

console.log('Landing contract acceptance passed.');
