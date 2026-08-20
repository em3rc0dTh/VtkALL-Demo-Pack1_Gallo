import assert from 'node:assert/strict';
import { landingSeeds } from '../../services/landing/landing.seed';
import { assertLandingContent } from '../../services/landing/landing.validation';

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));
const galloRecord = landingSeeds.find((seed) => seed.businessSlug === 'gallo');
assert.ok(galloRecord, 'Gallo landing seed must exist');

const repeatableSection = (anchor: string) => ({
  id: `gallo-section-editorial-${anchor}`,
  type: 'structured_content' as const,
  enabled: true,
  order: 90,
  frameHeight: 'content' as const,
  layout: { variant: 'gallo_repeatable_editorial', align: 'left' as const, media: 'none' as const, density: 'comfortable' as const },
  data: {
    eyebrow: 'Editorial',
    title: 'Sección repetible',
    body: 'Contenido controlado',
    instance: {
      schemaVersion: 1,
      templateKey: 'repeatable-editorial',
      semanticFamily: 'editorial',
      anchor,
      navLabel: 'Editorial',
      showInNavigation: true,
      repeatable: true,
      motion: 'rise',
      depth: 'none',
    },
  },
});

const valid = clone(galloRecord.draft);
valid.blocks.push(repeatableSection('editorial-extra') as any);
assert.equal(assertLandingContent(valid).blocks.length, 9, 'Unique repeatable SectionInstance must validate');

const reservedContactAnchor = clone(galloRecord.draft);
reservedContactAnchor.blocks.push(repeatableSection('contacto') as any);
assert.throws(
  () => assertLandingContent(reservedContactAnchor),
  /canonical gallo anchor contacto is already owned|section anchor must be unique/i,
  'Repeatable sections must not claim a canonical Gallo singleton anchor'
);

const invalidSingletonAnchor = clone(galloRecord.draft);
const hero = invalidSingletonAnchor.blocks.find((block: any) => block.layout?.variant === 'gallo_workshop_hero') as any;
hero.data.instance = {
  schemaVersion: 1,
  templateKey: 'hero',
  semanticFamily: 'hero',
  anchor: 'otro-inicio',
  navLabel: 'Inicio',
  showInNavigation: true,
  repeatable: false,
  motion: 'none',
  depth: 'none',
};
assert.throws(
  () => assertLandingContent(invalidSingletonAnchor),
  /must keep canonical anchor inicio/i,
  'Canonical singleton scenes must keep their stable route anchors'
);

const invalidSingletonRepeatable = clone(galloRecord.draft);
const services = invalidSingletonRepeatable.blocks.find((block: any) => block.layout?.variant === 'gallo_services_scene') as any;
services.data.instance = {
  schemaVersion: 1,
  templateKey: 'catalog',
  semanticFamily: 'catalog',
  anchor: 'servicios',
  navLabel: 'Servicios',
  showInNavigation: true,
  repeatable: true,
  motion: 'none',
  depth: 'none',
};
assert.throws(
  () => assertLandingContent(invalidSingletonRepeatable),
  /cannot be marked repeatable/i,
  'Canonical Gallo scenes must not become repeatable through raw API payloads'
);

const duplicateRepeatableAnchor = clone(galloRecord.draft);
duplicateRepeatableAnchor.blocks.push(repeatableSection('editorial-uno') as any);
const second = repeatableSection('editorial-uno') as any;
second.id = 'gallo-section-editorial-two';
second.order = 100;
duplicateRepeatableAnchor.blocks.push(second);
assert.throws(
  () => assertLandingContent(duplicateRepeatableAnchor),
  /section anchor must be unique/i,
  'Repeatable component anchors must remain unique'
);

console.log('Gallo SectionInstance contract passed.');
