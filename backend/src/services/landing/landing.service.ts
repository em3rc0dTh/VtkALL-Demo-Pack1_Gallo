import { LandingPage } from '../../models/LandingPage.model';
import { LandingPageVersion } from '../../models/LandingPageVersion.model';
import { BusinessProfile } from '../../models/BusinessProfile.model';
import { CatalogOffering } from '../../models/CatalogOffering.model';
import { assertLandingContent, landingPagePatchSchema } from './landing.validation';
import { LandingContent } from './landing.contracts';

const versionId = (landingPageId: string, version: number) => `${landingPageId}_v${version}`;

const serializePage = (page: any) => page?.toObject ? page.toObject() : page;

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
      await LandingPage.create(seed);
      await LandingPageVersion.create({
        _id: versionId(seed._id, 1),
        landingPageId: seed._id,
        businessSlug: seed.businessSlug,
        pageSlug: seed.pageSlug,
        version: 1,
        title: seed.title,
        content: seed.published || seed.draft,
        action: 'seed',
        createdBy: 'seed',
      });
      pages++;
      versions++;
      continue;
    }

    await LandingPage.updateOne(
      { _id: seed._id },
      {
        $setOnInsert: seed,
        $set: {
          title: existing.title || seed.title,
          status: existing.status || seed.status,
        },
      },
      { upsert: true }
    );
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

  return {
    landingPage: serializePage(page),
    content: page.published,
    businessProfile: serializePage(businessProfile),
    catalogOfferings: catalogOfferings.map(serializePage),
  };
};

export const getAdminLandingPage = async (businessSlug: string, pageSlug: string) => {
  const page = await LandingPage.findOne({ businessSlug, pageSlug });
  if (!page) return null;
  const versions = await LandingPageVersion.find({ landingPageId: page._id }).sort({ version: -1 }).limit(20);
  return {
    landingPage: serializePage(page),
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
  if (parsed.draft) page.draft = assertLandingContent(parsed.draft);
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

  const content = assertLandingContent(page.draft) as LandingContent;
  const nextVersion = (page.publishedVersion || 0) + 1;
  await LandingPageVersion.create({
    _id: versionId(page._id, nextVersion),
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

  page.draft = assertLandingContent(snapshot.content);
  await page.save();
  const latest = await LandingPageVersion.findOne({ landingPageId: page._id }).sort({ version: -1 });
  const nextVersion = Number(latest?.version || 0) + 1;
  await LandingPageVersion.create({
    _id: versionId(page._id, nextVersion),
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
