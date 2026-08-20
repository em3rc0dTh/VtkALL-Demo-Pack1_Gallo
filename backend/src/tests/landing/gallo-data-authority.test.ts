import assert from 'node:assert/strict';
import { GALLO_CATALOG_OFFERINGS } from '../../services/galloCatalog.seed';
import { galloLandingSeed } from '../../services/landing/galloLanding.seed';
import { toPublicBusinessProfile } from '../../services/landing/landing.service';

assert.equal(GALLO_CATALOG_OFFERINGS.length, 14, 'Gallo verified catalog must seed fourteen public offerings');
assert.ok(GALLO_CATALOG_OFFERINGS.every((offering) => offering.businessSlug === 'gallo'));
assert.ok(GALLO_CATALOG_OFFERINGS.every((offering) => offering.active === true));
assert.ok(GALLO_CATALOG_OFFERINGS.every((offering) => offering.publicVisible === true));
assert.ok(GALLO_CATALOG_OFFERINGS.every((offering) => !('priceLabel' in offering)), 'Migration must not invent service prices');
assert.ok(GALLO_CATALOG_OFFERINGS.every((offering) => !('durationMinutes' in offering)), 'Migration must not invent service durations');
assert.equal(new Set(GALLO_CATALOG_OFFERINGS.map((offering) => offering._id)).size, GALLO_CATALOG_OFFERINGS.length, 'CatalogOffering identities must be stable and unique');

const expectedCategories = new Set(['mecanica_mantenimiento', 'diagnostico_seguridad', 'carroceria_cuidado']);
assert.ok(GALLO_CATALOG_OFFERINGS.every((offering) => expectedCategories.has(offering.category)));

const hero = galloLandingSeed.blocks.find((block) => block.id === 'gallo-hero');
assert.equal(hero?.data.brandMode, 'business', 'Gallo hero must project business identity rather than own another brand master');
assert.equal(hero?.data.brandName, undefined, 'Gallo Landing must not duplicate BusinessProfile display name');

const services = galloLandingSeed.blocks.find((block) => block.id === 'gallo-services');
const serviceGroups = Array.isArray(services?.data.serviceGroups) ? services.data.serviceGroups : [];
assert.deepEqual(
  serviceGroups.map((group: any) => group.category),
  ['mecanica_mantenimiento', 'diagnostico_seguridad', 'carroceria_cuidado'],
  'Landing service groups must select CatalogOffering categories explicitly'
);
assert.ok(serviceGroups.every((group: any) => !Array.isArray(group.services)), 'Landing service groups must not carry a duplicate service master list');

const contact = galloLandingSeed.blocks.find((block) => block.id === 'gallo-contact');
assert.equal(contact?.data.address, undefined, 'Gallo Landing must not own the BusinessProfile address');
assert.equal(contact?.data.hours, undefined, 'Gallo Landing must not own BusinessProfile commercial hours');
assert.equal(contact?.data.phone, undefined, 'Gallo Landing must not own BusinessProfile phone');
assert.equal(contact?.data.email, undefined, 'Gallo Landing must not own BusinessProfile email');
assert.match(String(contact?.data.note || ''), /Solicitud enviada.*cita confirmada/i);

const publicProfile = toPublicBusinessProfile({
  businessSlug: 'gallo',
  businessName: 'Legacy Gallo',
  brand: { displayName: 'Legacy brand', tagline: 'Legacy tagline' },
  settings: {
    branding: { displayName: 'Gallo Autos', tagline: 'Diagnóstico. Transparencia. Trabajo bien hecho.' },
    contact: { primaryPhone: '+51 999 111 222', whatsapp: '+51 999 111 222', email: 'contacto@gallo.test' },
    locations: [{ id: 'gallo-main', addressLine: 'Av. La Molina 724', district: 'La Molina', city: 'Lima' }],
    commercialHours: { weekdays: '08:30–18:00', saturday: '08:30–15:00' },
  },
});

assert.equal(publicProfile?.brand.displayName, 'Gallo Autos');
assert.equal(publicProfile?.brand.tagline, 'Diagnóstico. Transparencia. Trabajo bien hecho.');
assert.equal(publicProfile?.contact.primaryPhone, '+51 999 111 222');
assert.equal(publicProfile?.locations[0].addressLine, 'Av. La Molina 724');
assert.equal(publicProfile?.commercialHours.weekdays, '08:30–18:00');

console.log('Gallo Landing data authority contract passed.');
