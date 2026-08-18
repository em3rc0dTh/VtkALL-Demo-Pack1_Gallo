const nonEmpty = (...values) => values.find((value) => typeof value === 'string' && value.trim()) || '';

export const projectGalloBusinessProfile = (profile = {}) => {
  const settings = profile?.settings || {};
  const settingsBrand = settings?.branding || {};
  const brand = profile?.brand || {};
  const contact = { ...(profile?.contact || {}), ...(settings?.contact || {}) };
  const locations = Array.isArray(settings?.locations)
    ? settings.locations
    : Array.isArray(profile?.locations)
      ? profile.locations
      : [];
  const primaryLocation = locations[0] || profile?.primaryLocation || {};
  const commercialHours = { ...(profile?.commercialHours || {}), ...(settings?.commercialHours || {}) };

  return {
    displayName: nonEmpty(settingsBrand.displayName, brand.displayName, profile?.businessName, 'Gallo Autos'),
    logoUrl: nonEmpty(settingsBrand.logoUrl, brand.logoUrl, '/brand/gallo-autos-logo.svg'),
    tagline: nonEmpty(settingsBrand.tagline, brand.tagline),
    contact,
    primaryLocation,
    commercialHours,
  };
};

export const formatGalloAddress = (location = {}) => {
  return [location.addressLine, location.district, location.city]
    .filter((value, index, values) => value && values.indexOf(value) === index)
    .join(', ');
};

export const galloHoursLines = (commercialHours = {}) => {
  return [
    commercialHours.weekdays ? `Lunes a viernes · ${commercialHours.weekdays}` : '',
    commercialHours.saturday ? `Sábado · ${commercialHours.saturday}` : '',
    commercialHours.sunday ? `Domingo · ${commercialHours.sunday}` : '',
  ].filter(Boolean);
};

const offeringName = (offering = {}) => offering.displayName || offering.name || offering.title || offering._id || '';
const normalizedText = (value = '') => String(value || '')
  .trim()
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '');

export const inferGalloCatalogCategory = (group = {}) => {
  const explicit = String(group?.category || '').trim();
  if (explicit) return explicit;

  const title = normalizedText(group?.title);
  if (title.includes('mecanica') || title.includes('mantenimiento')) return 'mecanica_mantenimiento';
  if (title.includes('diagnostico') || title.includes('seguridad')) return 'diagnostico_seguridad';
  if (title.includes('carroceria') || title.includes('cuidado')) return 'carroceria_cuidado';
  return '';
};

export const projectGalloCatalogGroups = ({ groups = [], catalogOfferings = [] } = {}) => {
  const activePublicOfferings = (Array.isArray(catalogOfferings) ? catalogOfferings : [])
    .filter((offering) => offering?.active !== false && offering?.publicVisible !== false)
    .sort((left, right) => Number(left?.displayOrder || 0) - Number(right?.displayOrder || 0));

  return (Array.isArray(groups) ? groups : []).map((group) => {
    const category = inferGalloCatalogCategory(group);
    const offerings = category
      ? activePublicOfferings.filter((offering) => String(offering?.category || '') === category)
      : [];
    return {
      ...group,
      category,
      offerings: offerings.map((offering) => ({
        id: offering._id,
        name: offeringName(offering),
        description: offering.description || '',
        priceLabel: offering.priceLabel || offering?.price?.display || '',
        durationMinutes: offering.durationMinutes,
      })),
    };
  });
};
