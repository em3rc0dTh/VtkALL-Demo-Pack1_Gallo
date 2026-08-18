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

assert.equal(landingSeeds.length, 3, 'Landing seed registry must include demo_test, turagua and gallo');
assert.ok(landingSeeds.some((seed) => seed.businessSlug === 'demo_test'));
assert.ok(landingSeeds.some((seed) => seed.businessSlug === 'turagua'));
assert.ok(landingSeeds.some((seed) => seed.businessSlug === 'gallo'));
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

const galloRecord = landingSeeds.find((seed) => seed.businessSlug === 'gallo');
assert.ok(galloRecord, 'Gallo landing seed record must exist');
assert.equal(galloRecord.pageSlug, 'home');
assert.equal(galloRecord.publishedVersion, 3);
const galloBlocks = galloRecord.draft.blocks;
assert.equal(galloBlocks.length, 8, 'Gallo Workshop landing must keep the eight-scene B0 contract');
assert.deepEqual(
  galloBlocks.map((block) => block.layout?.variant || block.data?.variant),
  [
    'gallo_workshop_hero',
    'gallo_partners_scene',
    'gallo_services_scene',
    'gallo_diagnostic_scene',
    'gallo_process_scene',
    'gallo_experience_scene',
    'gallo_evidence_scene',
    'gallo_contact_scene',
  ],
  'Gallo seed variants must preserve the Builder/public projection contract'
);
assert.deepEqual(
  galloBlocks.map((block) => block.order),
  [10, 20, 30, 40, 50, 60, 70, 80],
  'Gallo scene order must be explicit and deterministic'
);
assert.ok(galloBlocks.every((block) => block.enabled !== false));
assert.ok(galloBlocks.every((block) => block.frameHeight === 'viewport'));

const galloHero = galloBlocks.find((block) => block.id === 'gallo-hero');
assert.equal(galloHero?.data.primaryCta, 'Solicitar una cita');
assert.equal(galloHero?.data.secondaryCta, 'Explorar servicios');
assert.ok(galloHero?.data.heroMediaUrl, 'Gallo Hero media must be represented in the content contract');

const galloPartners = galloBlocks.find((block) => block.id === 'gallo-partners');
assert.ok(galloPartners?.data.brands?.length, 'Gallo partner scene must preserve vehicle brands');
assert.ok(galloPartners?.data.insurers?.length, 'Gallo partner scene must preserve insurers');

const galloContact = galloBlocks.find((block) => block.id === 'gallo-contact');
assert.equal(galloContact?.data.primaryCta, 'Contactar a Gallo');
assert.match(
  String(galloContact?.data.note || ''),
  /Solicitud enviada.*cita confirmada/i,
  'Gallo presentation must not imply automatic appointment confirmation'
);
assert.equal(galloRecord.draft.agent, undefined, 'Gallo B0 must not silently enable the deferred Agent/Hermes surface');

const clone = (value: any) => JSON.parse(JSON.stringify(value));

const repeatableContent = clone(galloRecord.draft);
repeatableContent.blocks.push(
  {
    id: 'gallo-section-editorial-alpha',
    type: 'structured_content',
    enabled: true,
    order: 90,
    frameHeight: 'content',
    layout: { variant: 'gallo_repeatable_editorial', align: 'left', media: 'none', density: 'comfortable' },
    data: {
      eyebrow: 'Editorial',
      title: 'Sección repetible A',
      body: 'Contenido A',
      instance: {
        schemaVersion: 1,
        templateKey: 'repeatable-editorial',
        semanticFamily: 'editorial',
        anchor: 'editorial-alpha',
        navLabel: 'Editorial A',
        showInNavigation: true,
        repeatable: true,
        motion: 'rise',
        depth: 'none',
      },
    },
  },
  {
    id: 'gallo-section-editorial-beta',
    type: 'structured_content',
    enabled: true,
    order: 100,
    frameHeight: 'content',
    layout: { variant: 'gallo_repeatable_editorial', align: 'right', media: 'none', density: 'comfortable' },
    data: {
      eyebrow: 'Editorial',
      title: 'Sección repetible B',
      body: 'Contenido B',
      instance: {
        schemaVersion: 1,
        templateKey: 'repeatable-editorial',
        semanticFamily: 'editorial',
        anchor: 'editorial-beta',
        navLabel: 'Editorial B',
        showInNavigation: false,
        repeatable: true,
        motion: 'fade',
        depth: 'none',
      },
    },
  }
);
assert.equal(assertLandingContent(repeatableContent).blocks.length, 10, 'Repeatable section instances with unique identity must validate');

const duplicateId = clone(repeatableContent);
duplicateId.blocks[9].id = duplicateId.blocks[8].id;
assert.throws(() => assertLandingContent(duplicateId), /block id must be unique/i, 'Duplicate section IDs must be rejected');

const duplicateAnchor = clone(repeatableContent);
duplicateAnchor.blocks[9].data.instance.anchor = duplicateAnchor.blocks[8].data.instance.anchor;
assert.throws(() => assertLandingContent(duplicateAnchor), /anchor must be unique/i, 'Duplicate section anchors must be rejected');

const invalidAnchor = clone(repeatableContent);
invalidAnchor.blocks[9].data.instance.anchor = 'No valid anchor';
assert.throws(() => assertLandingContent(invalidAnchor), /URL-safe kebab-case/i, 'Section anchors must remain URL-safe');

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
