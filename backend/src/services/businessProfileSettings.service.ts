import { z } from 'zod';
import fs from 'node:fs/promises';
import path from 'node:path';
import { findBusinessProfileBySlug, updateBusinessProfileBySlug } from '../repositories/businessProfile.repository';

const isManagedBusinessUploadPath = (value: string) => /^\/uploads\/business\/[a-z0-9_-]+\/[a-z0-9_.-]+$/i.test(value);
const isPublicWebUrl = (value: string) => /^https?:\/\//i.test(value);
const isAllowedLogoUrl = (value: string) => /^https:\/\//i.test(value) || isManagedBusinessUploadPath(value);

const optionalUrl = z.string().trim().refine((value) => value === '' || isPublicWebUrl(value), 'URL must be HTTP or HTTPS.').or(z.literal('')).optional();
const optionalLogoUrl = z.string().trim().refine(isAllowedLogoUrl, 'Logo must be uploaded before saving settings.').nullable().optional();
const optionalEmail = z.string().trim().email().or(z.literal('')).optional();
const optionalCoordinate = z.number().min(-180).max(180).nullable().optional();
const maxLogoBytes = 3 * 1024 * 1024;
const hasOwn = (value: any, key: string) => Boolean(value && Object.prototype.hasOwnProperty.call(value, key));
const pickBrandValue = (settingsBrand: any, profileBrand: any, key: string, fallback = '') =>
  settingsBrand?.[key] || profileBrand?.[key] || fallback || '';
const brandPatchSchema = z.object({
  displayName: z.string().trim().min(1).max(120).optional(),
  logoUrl: optionalLogoUrl,
  tagline: z.string().trim().max(180).optional(),
}).optional();

const settingsPatchSchema = z.object({
  expectedVersion: z.number().int().nonnegative(),
  changes: z.object({
    brand: brandPatchSchema,
    branding: brandPatchSchema,
    contact: z.object({
      primaryPhone: z.string().trim().max(40).optional(),
      whatsapp: z.string().trim().max(40).optional(),
      email: optionalEmail,
    }).optional(),
    primaryLocation: z.object({
      id: z.string().trim().min(1).max(80).optional(),
      name: z.string().trim().max(120).optional(),
      addressLine: z.string().trim().max(240).optional(),
      reference: z.string().trim().max(180).optional(),
      district: z.string().trim().max(80).optional(),
      city: z.string().trim().max(80).optional(),
      country: z.string().trim().max(80).optional(),
      latitude: optionalCoordinate,
      longitude: optionalCoordinate,
      directionsUrl: optionalUrl,
    }).optional(),
    commercialHours: z.object({
      weekdays: z.string().trim().max(80).optional(),
      saturday: z.string().trim().max(80).optional(),
      sunday: z.string().trim().max(80).optional(),
      summary: z.string().trim().max(160).optional(),
    }).optional(),
  }).strict(),
}).strict();

export const validateBusinessProfileSettingsPatch = (payload: unknown) => settingsPatchSchema.parse(payload);

const toSettingsDto = (profile: any) => {
  const settings = profile.settings || {};
  const settingsBrand = settings.branding || {};
  const location = settings.locations?.[0] || {};
  const brand = {
    displayName: pickBrandValue(settingsBrand, profile.brand, 'displayName', profile.businessName),
    tagline: pickBrandValue(settingsBrand, profile.brand, 'tagline'),
    logoUrl: pickBrandValue(settingsBrand, profile.brand, 'logoUrl'),
  };
  return {
    businessSlug: profile.businessSlug,
    version: Number(profile.settingsVersion || 0),
    brand,
    branding: brand,
    contact: {
      primaryPhone: settings.contact?.primaryPhone || '',
      whatsapp: settings.contact?.whatsapp || '',
      email: settings.contact?.email || '',
    },
    primaryLocation: {
      id: location.id || 'main',
      name: location.name || '',
      addressLine: location.addressLine || '',
      reference: location.reference || '',
      district: location.district || '',
      city: location.city || '',
      country: location.country || '',
      latitude: location.latitude ?? null,
      longitude: location.longitude ?? null,
      directionsUrl: location.directionsUrl || '',
    },
    commercialHours: {
      weekdays: settings.commercialHours?.weekdays || '',
      saturday: settings.commercialHours?.saturday || '',
      sunday: settings.commercialHours?.sunday || '',
      summary: settings.commercialHours?.summary || '',
    },
    updatedAt: profile.updatedAt,
    updatedBy: settings.updatedBy || '',
  };
};

export const getBusinessProfileSettings = async (businessSlug: string) => {
  const profile = await findBusinessProfileBySlug(businessSlug);
  if (!profile) {
    const error: any = new Error('BusinessProfile not found.');
    error.status = 404;
    error.code = 'BUSINESS_PROFILE_NOT_FOUND';
    throw error;
  }
  return toSettingsDto(profile.toObject ? profile.toObject() : profile);
};

export const patchBusinessProfileSettings = async (businessSlug: string, payload: unknown, actor = 'admin') => {
  const parsed = validateBusinessProfileSettingsPatch(payload);
  const brandChanges = {
    ...(parsed.changes.branding || {}),
    ...(parsed.changes.brand || {}),
  };
  const current = await findBusinessProfileBySlug(businessSlug).lean().exec() as any;
  if (!current) {
    const error: any = new Error('BusinessProfile not found.');
    error.status = 404;
    error.code = 'BUSINESS_PROFILE_NOT_FOUND';
    throw error;
  }
  if (Number(current.settingsVersion || 0) !== parsed.expectedVersion) {
    const error: any = new Error('BusinessProfile settings changed in another session.');
    error.status = 409;
    error.code = 'BUSINESS_PROFILE_VERSION_CONFLICT';
    throw error;
  }

  const settings = current.settings || {};
  const primaryLocation = parsed.changes.primaryLocation;
  const location = {
    ...(settings.locations?.[0] || {}),
    ...(primaryLocation || {}),
    id: primaryLocation?.id || settings.locations?.[0]?.id || 'main',
  };
  const nextSettings = {
    ...settings,
    branding: { ...(settings.branding || {}), ...brandChanges },
    contact: { ...(settings.contact || {}), ...(parsed.changes.contact || {}) },
    locations: primaryLocation ? [location] : (settings.locations || []),
    commercialHours: { ...(settings.commercialHours || {}), ...(parsed.changes.commercialHours || {}) },
    updatedBy: actor,
  };

  const nextBrand = {
    ...(current.brand || {}),
    ...(brandChanges.displayName ? { displayName: brandChanges.displayName } : {}),
    ...(brandChanges.logoUrl !== undefined ? { logoUrl: brandChanges.logoUrl } : {}),
    ...(brandChanges.tagline !== undefined ? { tagline: brandChanges.tagline } : {}),
  };

  const updated = await updateBusinessProfileBySlug(businessSlug, parsed.expectedVersion, {
    ...(brandChanges.displayName ? { businessName: brandChanges.displayName } : {}),
    brand: nextBrand,
    settings: nextSettings,
  });
  if (!updated) {
    const error: any = new Error('BusinessProfile settings changed in another session.');
    error.status = 409;
    error.code = 'BUSINESS_PROFILE_VERSION_CONFLICT';
    throw error;
  }
  return toSettingsDto(updated.toObject ? updated.toObject() : updated);
};

export const businessProfileSettingsValidationErrorCode = 'BUSINESS_PROFILE_VALIDATION_ERROR';

const logoMimeToExtension: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
};

export const parseAndValidateBusinessLogoUpload = (contentType: string, buffer: Buffer) => {
  const parsed = parseMultipartLogo(contentType, buffer);
  const extension = logoMimeToExtension[parsed.mimeType];
  if (!extension) {
    const error: any = new Error('Solo se aceptan logos PNG, JPEG o WebP.');
    error.status = 422;
    error.code = 'BUSINESS_PROFILE_LOGO_UPLOAD_INVALID';
    throw error;
  }
  if (parsed.content.length > maxLogoBytes) {
    const error: any = new Error('El logo no puede superar 3MB.');
    error.status = 422;
    error.code = 'BUSINESS_PROFILE_LOGO_UPLOAD_TOO_LARGE';
    throw error;
  }
  return { ...parsed, extension };
};

const parseMultipartLogo = (contentType: string, buffer: Buffer) => {
  const boundaryMatch = /boundary=(?:"([^"]+)"|([^;]+))/i.exec(contentType || '');
  const boundary = boundaryMatch?.[1] || boundaryMatch?.[2];
  if (!boundary) {
    const error: any = new Error('Missing multipart boundary.');
    error.status = 422;
    error.code = 'BUSINESS_PROFILE_LOGO_UPLOAD_INVALID';
    throw error;
  }

  const delimiter = Buffer.from(`--${boundary}`);
  const parts: Buffer[] = [];
  let cursor = buffer.indexOf(delimiter);
  while (cursor !== -1) {
    const next = buffer.indexOf(delimiter, cursor + delimiter.length);
    if (next === -1) break;
    parts.push(buffer.subarray(cursor + delimiter.length, next));
    cursor = next;
  }

  for (const part of parts) {
    const headerEnd = part.indexOf(Buffer.from('\r\n\r\n'));
    if (headerEnd === -1) continue;
    const headers = part.subarray(0, headerEnd).toString('utf8');
    const partName = /name=(?:"([^"]+)"|([^;\r\n]+))/i.exec(headers);
    if ((partName?.[1] || partName?.[2]) !== 'logo') continue;
    const filename = /filename=(?:"([^"]+)"|([^;\r\n]+))/i.exec(headers);
    const mimeType = /content-type:\s*([^\r\n]+)/i.exec(headers)?.[1]?.trim().toLowerCase() || '';
    const content = part.subarray(headerEnd + 4, part.length - 2);
    return { filename: filename?.[1] || filename?.[2] || 'logo', mimeType, content };
  }

  const error: any = new Error('Logo file is required.');
  error.status = 422;
  error.code = 'BUSINESS_PROFILE_LOGO_UPLOAD_INVALID';
  throw error;
};

const safeSlug = (value: string) => String(value || 'business').toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '') || 'business';

export const uploadBusinessLogo = async (businessSlug: string, contentType: string, buffer: Buffer) => {
  await getBusinessProfileSettings(businessSlug);
  const parsed = parseAndValidateBusinessLogoUpload(contentType, buffer);
  const slug = safeSlug(businessSlug);
  const publicDir = path.resolve(process.env.BUSINESS_UPLOADS_DIR || path.join(process.cwd(), 'uploads'), 'business', slug);
  await fs.mkdir(publicDir, { recursive: true });
  const fileName = `logo-${Date.now()}-${safeSlug(parsed.filename).slice(0, 32)}.${parsed.extension}`;
  const filePath = path.join(publicDir, fileName);
  await fs.writeFile(filePath, parsed.content);
  return {
    assetId: `asset_${slug}_${Date.now()}`,
    logoUrl: `/uploads/business/${slug}/${fileName}`,
  };
};
