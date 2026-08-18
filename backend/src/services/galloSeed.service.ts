import { BusinessProfile } from '../models/BusinessProfile.model';
import { galloLandingSeedRecord } from './landing/galloLanding.seed';
import { seedLandingPages } from './landing/landing.service';

export const GALLO_BUSINESS_PROFILE = {
  _id: 'bp_gallo',
  businessSlug: 'gallo',
  businessName: 'Gallo Autos',
  verticalType: 'vehicle_service',
  brand: {
    displayName: 'Gallo Autos',
    tagline: 'Diagnóstico. Transparencia. Trabajo bien hecho.',
    country: 'PE',
    timezone: 'America/Lima',
  },
  settings: {
    branding: {
      displayName: 'Gallo Autos',
      tagline: 'Diagnóstico. Transparencia. Trabajo bien hecho.',
      timezone: 'America/Lima',
      language: 'es-PE',
    },
    contact: {
      primaryPhone: '',
      alternatePhones: [],
      email: '',
      whatsapp: '',
    },
    locations: [
      {
        id: 'gallo-main',
        name: 'Gallo Autos',
        addressLine: 'Av. La Molina 724',
        district: 'La Molina',
        city: 'Lima',
        country: 'Peru',
        latitude: null,
        longitude: null,
        directionsUrl: '',
      },
    ],
    commercialHours: {
      weekdays: '08:30–18:00',
      saturday: '08:30–15:00',
      sunday: '',
      summary: 'Lunes a viernes · 08:30–18:00 · Sábado · 08:30–15:00',
    },
    socials: [],
  },
  settingsVersion: 0,
  labels: {
    customer: 'Cliente',
    case: 'Solicitud',
    managedEntity: 'Vehículo',
    appointment: 'Cita',
  },
  features: {
    supportsAppointments: true,
    supportsQuotes: true,
    supportsWorkOrders: true,
    supportsVehicleData: true,
  },
  active: true,
};

export const seedGalloBusiness = async (reset = false) => {
  if (reset) {
    await BusinessProfile.deleteMany({ businessSlug: 'gallo' });
  }

  await BusinessProfile.updateOne(
    { _id: GALLO_BUSINESS_PROFILE._id },
    reset
      ? { $set: GALLO_BUSINESS_PROFILE }
      : { $setOnInsert: GALLO_BUSINESS_PROFILE },
    { upsert: true }
  );

  const landing = await seedLandingPages([galloLandingSeedRecord], reset);
  console.log('gallo seed completed.');
  console.log('gallo.businessProfiles: 1');
  console.log(`gallo.landing.pages: ${landing.pages}`);
  console.log(`gallo.landing.versions: ${landing.versions}`);

  return {
    businessProfiles: 1,
    landingPages: landing.pages,
    landingVersions: landing.versions,
  };
};
