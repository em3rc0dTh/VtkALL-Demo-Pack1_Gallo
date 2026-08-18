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

export const projectGalloCatalogGroups = ({ groups = [], catalogOfferings = [] } = {}) => {
  const activePublicOfferings = (Array.isArray(catalogOfferings) ? catalogOfferings : [])
    .filter((offering) => offering?.active !== false && offering?.publicVisible !== false)
    .sort((left, right) => Number(left?.displayOrder || 0) - Number(right?.displayOrder || 0));

  return (Array.isArray(groups) ? groups : []).map((group) => {
    const category = String(group?.category || '').trim();
    const offerings = activePublicOfferings.filter((offering) => !category || String(offering?.category || '') === category);
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
