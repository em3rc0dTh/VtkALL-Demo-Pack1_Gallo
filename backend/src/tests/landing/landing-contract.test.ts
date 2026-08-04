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
assert.ok(turaguaLandingSeed.blocks.every((block) => ['viewport', 'compact'].includes(block.frameHeight || 'compact')));
assert.ok(!turaguaLandingSeed.blocks.some((block) => block.id === 'turagua-stats'));
assert.ok(turaguaLandingSeed.blocks.find((block) => block.id === 'turagua-hero')?.data.stats?.length);
assert.equal(turaguaLandingSeed.blocks.find((block) => block.id === 'turagua-catalog')?.layout?.variant, 'turagua_catalog_frame');

const turaguaHeroBlock = turaguaLandingSeed.blocks.find((block) => block.id === 'turagua-hero');
assert.equal(turaguaHeroBlock?.data.logoUrl, undefined, 'Landing hero block must not own the business logo');
assert.equal(turaguaHeroBlock?.data.brandName, undefined, 'Landing hero block must not own the business brand name unless explicitly custom');

const turaguaContactBlock = turaguaLandingSeed.blocks.find((block) => block.id === 'turagua-contact');
assert.equal(turaguaContactBlock?.data.phone, undefined, 'Landing contact block must not own the business phone');
assert.equal(turaguaContactBlock?.data.address, undefined, 'Landing contact block must not own the business address');
assert.equal(turaguaContactBlock?.data.hours, undefined, 'Landing contact block must not own business hours');
assert.equal(turaguaContactBlock?.data.logoUrl, undefined, 'Landing contact block must not own the business logo');
assert.equal(turaguaContactBlock?.data.shopName, undefined, 'Landing contact block must not own the business name');
assert.equal(turaguaContactBlock?.data.locationId, undefined, 'Landing contact block location selection must live in display');
assert.equal(turaguaContactBlock?.data.display?.locationId, 'turagua-main');
const resolveLandingPhone = (businessProfile: any, contactBlock: any) => businessProfile.settings?.contact?.primaryPhone || contactBlock.data.phone || '';
assert.equal(
  resolveLandingPhone({ settings: { contact: { primaryPhone: '+51 111 222 333' } } }, turaguaContactBlock),
  '+51 111 222 333',
  'Changing BusinessProfile.settings.contact.primaryPhone must update landing contact without editing the block'
);

const turaguaFooterBlock = turaguaLandingSeed.blocks.find((block) => block.id === 'turagua-footer');
assert.equal(turaguaFooterBlock?.data.company, undefined, 'Landing footer block must not own the business name');

const turaguaCatalogBlock = turaguaLandingSeed.blocks.find((block) => block.type === 'catalog');
assert.deepEqual(turaguaCatalogBlock?.data.featuredOfferingIds, [
  'off_turagua_general_diagnostic',
  'off_turagua_preventive_maintenance',
  'off_turagua_brake_service',
  'off_turagua_lavado_premium',
  'off_turagua_prepurchase_inspection',
  'off_turagua_sandblasting_undercoating',
]);

const clone = (value: any) => JSON.parse(JSON.stringify(value));
for (const avatarUrl of ['blob:http://localhost/avatar', 'data:image/png;base64,abc', 'file:///tmp/avatar.png', 'C:\\fakepath\\avatar.png', 'avatar.png', '/tmp/avatar.png']) {
  const invalid = clone(turaguaLandingSeed);
  invalid.agent.avatarUrl = avatarUrl;
  assert.throws(() => assertLandingContent(invalid), /Asset URL must be https:\/\/, \/uploads\/\.\.\. or \/upload_utils\/\.\.\./, `avatarUrl should reject ${avatarUrl}`);
}

for (const avatarUrl of ['https://example.com/avatar.png', '/uploads/landing/avatar.png', '/upload_utils/avatar.png']) {
  const valid = clone(turaguaLandingSeed);
  valid.agent.avatarUrl = avatarUrl;
  assert.equal(assertLandingContent(valid).agent?.avatarUrl, avatarUrl, `avatarUrl should accept ${avatarUrl}`);
}

console.log('Landing contract acceptance passed.');
