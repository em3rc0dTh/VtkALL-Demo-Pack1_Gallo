import { LandingPage } from '../../models/LandingPage.model';
import { LandingPageVersion } from '../../models/LandingPageVersion.model';
import { BusinessProfile } from '../../models/BusinessProfile.model';
import { CatalogOffering } from '../../models/CatalogOffering.model';
import { assertLandingContent, landingPagePatchSchema } from './landing.validation';
import { LandingContent } from './landing.contracts';
import fs from 'node:fs/promises';
import path from 'node:path';

const versionId = (landingPageId: string, version: number) => `${landingPageId}_v${version}`;

const serializePage = (page: any) => page?.toObject ? page.toObject() : page;
const clone = (value: any) => JSON.parse(JSON.stringify(value || {}));

const nonEmpty = (...values: any[]) => values.find((value) => typeof value === 'string' && value.trim()) || '';
const hasOwn = (value: any, key: string) => Boolean(value && Object.prototype.hasOwnProperty.call(value, key));
const managedAssetRootFor = (assetUrl: string) => {
  if (assetUrl.startsWith('/uploads/')) {
    return {
      root: path.resolve(process.env.BUSINESS_UPLOADS_DIR || path.join(process.cwd(), 'uploads')),
      relativePath: assetUrl.replace(/^\/uploads\//, ''),
    };
  }
  if (assetUrl.startsWith('/upload_utils/')) {
    return {
      root: path.resolve(process.env.UPLOAD_UTILS_DIR || path.join(process.cwd(), 'upload_utils')),
      relativePath: assetUrl.replace(/^\/upload_utils\//, ''),
    };
  }
  return null;
};

const assertManagedAssetExists = async (assetUrl: string, label: string) => {
  const normalized = String(assetUrl || '').split(/[?#]/)[0];
  const managed = managedAssetRootFor(normalized);
  if (!managed) return;
  const target = path.resolve(managed.root, managed.relativePath);
  if (!target.startsWith(`${managed.root}${path.sep}`)) {
    const error: any = new Error(`${label} references an invalid managed asset path.`);
    error.status = 422;
    error.code = 'LANDING_ASSET_INVALID_PATH';
    throw error;
  }
  try {
    const stats = await fs.stat(target);
    if (stats.isFile()) return;
  } catch (error) {
    // handled below
  }
  const error: any = new Error(`${label} file is no longer available.`);
  error.status = 422;
  error.code = 'LANDING_ASSET_NOT_FOUND';
  throw error;
};

const assertLandingAgentAssetsExist = async (content: any) => {
  await assertManagedAssetExists(content?.agent?.avatarUrl || '', 'Agent avatar');
  await assertManagedAssetExists(content?.agent?.bannerUrl || '', 'Agent banner');
};

const normalizedVersion = (value: any, fallback = 1) => {
  const version = Number(value);
  return Number.isInteger(version) && version > 0 ? version : fallback;
};

const ensurePublishedVersionSnapshot = async (page: any, createdBy: string) => {
  const publishedVersion = normalizedVersion(page?.publishedVersion, 0);
  if (!page?.published || publishedVersion < 1) return null;

  const existing = await LandingPageVersion.findOne({ landingPageId: page._id, version: publishedVersion });
  if (existing) return existing;

  return LandingPageVersion.create({
    _id: versionId(String(page._id), publishedVersion),
    landingPageId: page._id,
    businessSlug: page.businessSlug,
    pageSlug: page.pageSlug,
    version: publishedVersion,
    title: page.title,
    content: page.published,
    action: 'publish',
    createdBy,
  });
};

export const toPublicBusinessProfile = (profile: any) => {
  const serialized = serializePage(profile);
  if (!serialized) return null;
  const settings = serialized.settings || {};
  const settingsBrand = settings.branding || {};
  const brand = {
    ...(serialized.brand || {}),
    displayName: nonEmpty(settingsBrand.displayName, serialized.brand?.displayName, serialized.businessName, serialized.businessSlug),
    logoUrl: hasOwn(settingsBrand, 'logoUrl') ? nonEmpty(settingsBrand.logoUrl) : nonEmpty(serialized.brand?.logoUrl),
    tagline: hasOwn(settingsBrand, 'tagline') ? nonEmpty(settingsBrand.tagline) : nonEmpty(serialized.brand?.tagline),
  };
  const contact = {
    ...(serialized.contact || {}),
    ...(settings.contact || {}),
  };
  const locations = Array.isArray(settings.locations)
    ? settings.locations
    : Array.isArray(serialized.locations)
      ? serialized.locations
      : [];
  const commercialHours = {
    ...(serialized.commercialHours || {}),
    ...(settings.commercialHours || {}),
  };

  return {
    ...serialized,
    brand,
    branding: {
      ...(serialized.branding || {}),
      displayName: brand.displayName,
      name: brand.displayName,
      logoUrl: brand.logoUrl,
      tagline: brand.tagline,
    },
    contact,
    locations,
    commercialHours,
    settings: {
      ...settings,
      branding: {
        ...(settings.branding || {}),
        displayName: brand.displayName,
        logoUrl: brand.logoUrl,
        tagline: brand.tagline,
      },
      contact,
      locations,
      commercialHours,
    },
  };
};

const stripBusinessOwnedLandingData = (content: any) => {
  if (!content?.blocks) return content;
  const next = clone(content);
  next.blocks = next.blocks.map((block: any) => {
    const data = { ...(block.data || {}) };
    if (block.type === 'hero' && data.brandMode !== 'custom') {
      delete data.logoUrl;
      delete data.brandName;
      delete data.brandTagline;
    }
    if (block.type === 'contact') {
      for (const key of ['shopName', 'brandName', 'tagline', 'logoUrl', 'phone', 'email', 'address', 'latitude', 'longitude', 'hours']) {
        delete data[key];
      }
      if (data.locationId) {
        data.display = { ...(data.display || {}), locationId: data.display?.locationId || data.locationId };
        delete data.locationId;
      }
    }
    if (block.type === 'footer') {
      delete data.company;
    }
    return { ...block, data };
  });
  return next;
};

const toPublicLandingPageView = (page: any) => {
  const serialized = serializePage(page);
  if (!serialized) return null;
  return {
    ...serialized,
    draft: stripBusinessOwnedLandingData(serialized.draft),
    published: stripBusinessOwnedLandingData(serialized.published),
  };
};

export const seedLandingPages = async (seeds: any[], reset: boolean) => {
  if (reset) {
    await LandingPage.deleteMany({ businessSlug: { $in: seeds.map((seed) => seed.businessSlug) } });
    await LandingPageVersion.deleteMany({ businessSlug: { $in: seeds.map((seed) => seed.businessSlug) } });
  }

  let pages = 0;
  let versions = 0;
  for (const seed of seeds) {
    const existing = await LandingPage.findById(seed._id);
    if (!existing) {
      const seedVersion = normalizedVersion(seed.publishedVersion, 1);
      const page = await LandingPage.create(seed);
      await LandingPageVersion.create({
        _id: versionId(seed._id, seedVersion),
        landingPageId: seed._id,
        businessSlug: seed.businessSlug,
        pageSlug: seed.pageSlug,
        version: seedVersion,
        title: seed.title,
        content: seed.published || seed.draft,
        action: 'seed',
        createdBy: 'seed',
      });
      await ensurePublishedVersionSnapshot(page, 'seed:reconcile-published-version');
      pages++;
      versions++;
      continue;
    }

    await LandingPage.updateOne(
      { _id: seed._id },
      {
        $set: {
          title: existing.title || seed.title,
          status: existing.status || seed.status,
        },
      }
    );
    await ensurePublishedVersionSnapshot(existing, 'seed:reconcile-published-version');
    pages++;
  }

  return { pages, versions };
};

export const getPublicLandingPage = async (businessSlug: string, pageSlug: string) => {
  const [page, businessProfile, catalogOfferings] = await Promise.all([
    LandingPage.findOne({ businessSlug, pageSlug, status: 'published' }),
    BusinessProfile.findOne({ businessSlug, active: true }),
    CatalogOffering.find({ businessSlug, active: true, publicVisible: true }).sort({ displayOrder: 1, name: 1 }).limit(100),
  ]);

  if (!page || !page.published) {
    return null;
  }

  const landingPage = toPublicLandingPageView(page);
  return {
    landingPage,
    content: landingPage?.published,
    businessProfile: toPublicBusinessProfile(businessProfile),
    catalogOfferings: catalogOfferings.map(serializePage),
  };
};

export const getAdminLandingPage = async (businessSlug: string, pageSlug: string) => {
  const [page, businessProfile, catalogOfferings] = await Promise.all([
    LandingPage.findOne({ businessSlug, pageSlug }),
    BusinessProfile.findOne({ businessSlug, active: true }),
    CatalogOffering.find({ businessSlug, active: true, publicVisible: true }).sort({ displayOrder: 1, name: 1 }).limit(100),
  ]);
  if (!page) return null;
  const versions = await LandingPageVersion.find({ landingPageId: page._id }).sort({ version: -1 }).limit(20);
  return {
    landingPage: toPublicLandingPageView(page),
    businessProfile: toPublicBusinessProfile(businessProfile),
    catalogOfferings: catalogOfferings.map(serializePage),
    versions: versions.map(serializePage),
  };
};

export const updateDraftLandingPage = async ({
  businessSlug,
  pageSlug,
  patch,
}: {
  businessSlug: string;
  pageSlug: string;
  patch: unknown;
}) => {
  const parsed = landingPagePatchSchema.parse(patch);
  const page = await LandingPage.findOne({ businessSlug, pageSlug });
  if (!page) return null;

  if (parsed.title) page.title = parsed.title;
  if (parsed.draft) {
    const nextDraft = assertLandingContent(stripBusinessOwnedLandingData(parsed.draft));
    await assertLandingAgentAssetsExist(nextDraft);
    page.draft = nextDraft;
  }
  await page.save();
  return serializePage(page);
};

export const publishLandingPage = async ({
  businessSlug,
  pageSlug,
  actor = 'admin',
}: {
  businessSlug: string;
  pageSlug: string;
  actor?: string;
}) => {
  const page = await LandingPage.findOne({ businessSlug, pageSlug });
  if (!page) return null;

  const content = assertLandingContent(stripBusinessOwnedLandingData(page.draft)) as LandingContent;
  await assertLandingAgentAssetsExist(content);
  await ensurePublishedVersionSnapshot(page, `${actor}:preserve-existing-published`);
  const latest = await LandingPageVersion.findOne({ landingPageId: page._id }).sort({ version: -1 });
  const nextVersion = Math.max(Number(latest?.version || 0), Number(page.publishedVersion || 0)) + 1;
  await LandingPageVersion.create({
    _id: versionId(String(page._id), nextVersion),
    landingPageId: page._id,
    businessSlug,
    pageSlug,
    version: nextVersion,
    title: page.title,
    content,
    action: 'publish',
    createdBy: actor,
  });

  page.status = 'published';
  page.published = content;
  page.publishedVersion = nextVersion;
  await page.save();
  return serializePage(page);
};

export const restoreLandingPageVersion = async ({
  businessSlug,
  pageSlug,
  version,
  actor = 'admin',
}: {
  businessSlug: string;
  pageSlug: string;
  version: number;
  actor?: string;
}) => {
  const page = await LandingPage.findOne({ businessSlug, pageSlug });
  if (!page) return null;

  const snapshot = await LandingPageVersion.findOne({ landingPageId: page._id, version });
  if (!snapshot) return null;

  page.draft = assertLandingContent(stripBusinessOwnedLandingData(snapshot.content));
  await page.save();
  await ensurePublishedVersionSnapshot(page, `${actor}:preserve-existing-published`);
  const latest = await LandingPageVersion.findOne({ landingPageId: page._id }).sort({ version: -1 });
  const nextVersion = Math.max(Number(latest?.version || 0), Number(page.publishedVersion || 0)) + 1;
  await LandingPageVersion.create({
    _id: versionId(String(page._id), nextVersion),
    landingPageId: page._id,
    businessSlug,
    pageSlug,
    version: nextVersion,
    title: page.title,
    content: page.draft,
    action: 'restore',
    createdBy: actor,
  });
  return serializePage(page);
};
