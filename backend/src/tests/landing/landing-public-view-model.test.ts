import assert from 'node:assert/strict';
import { toPublicBusinessProfile } from '../../services/landing/landing.service';
import { turaguaLandingSeed } from '../../services/landing/landing.seed';

const publicProfile = toPublicBusinessProfile({
  businessSlug: 'turagua',
  businessName: 'Nombre legacy',
  brand: {
    displayName: 'Marca legacy',
    logoUrl: '/images/legacy-logo.jpg',
    tagline: 'Tagline legacy',
  },
  contact: {
    primaryPhone: '+51 legacy',
  },
  settings: {
    branding: {
      displayName: 'Turagua Nuevo',
      logoUrl: '/uploads/business/turagua/logo-nuevo.webp',
      tagline: 'Tagline nuevo',
    },
    contact: {
      primaryPhone: '+51 999 000 111',
      email: 'nuevo@turagua.pe',
    },
    locations: [
      {
        id: 'turagua-main',
        addressLine: 'Direccion nueva',
        latitude: -12.1,
        longitude: -77.1,
      },
    ],
    commercialHours: {
      summary: 'Horario nuevo',
    },
  },
});

assert.equal(publicProfile?.brand.displayName, 'Turagua Nuevo');
assert.equal(publicProfile?.brand.logoUrl, '/uploads/business/turagua/logo-nuevo.webp');
assert.equal(publicProfile?.brand.tagline, 'Tagline nuevo');
assert.equal(publicProfile?.contact.primaryPhone, '+51 999 000 111');
assert.equal(publicProfile?.contact.email, 'nuevo@turagua.pe');
assert.equal(publicProfile?.locations[0].addressLine, 'Direccion nueva');
assert.equal(publicProfile?.commercialHours.summary, 'Horario nuevo');

const deletedLogoProfile = toPublicBusinessProfile({
  businessSlug: 'turagua',
  brand: { logoUrl: '/images/legacy-logo.jpg' },
  settings: { branding: { logoUrl: null } },
});

assert.equal(deletedLogoProfile?.brand.logoUrl, '', 'Explicit logo deletion must not revive legacy logo');

const hero = turaguaLandingSeed.blocks.find((block) => block.id === 'turagua-hero');
const contact = turaguaLandingSeed.blocks.find((block) => block.id === 'turagua-contact');
const footer = turaguaLandingSeed.blocks.find((block) => block.id === 'turagua-footer');

assert.equal(hero?.data.logoUrl, undefined);
assert.equal(contact?.data.phone, undefined);
assert.equal(contact?.data.address, undefined);
assert.equal(contact?.data.hours, undefined);
assert.equal(footer?.data.company, undefined);

console.log('Public landing BusinessProfile view model passed.');
