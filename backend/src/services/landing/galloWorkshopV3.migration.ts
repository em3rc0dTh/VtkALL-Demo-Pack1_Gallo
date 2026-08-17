import { LandingPage } from '../../models/LandingPage.model';
import { LandingPageVersion } from '../../models/LandingPageVersion.model';
import { galloLandingV3Seed } from './galloLandingV3.seed';
import { publishLandingPage, updateDraftLandingPage } from './landing.service';

const TARGET_BUSINESS_SLUG = 'gallo';
const TARGET_PAGE_SLUG = 'home';
const MIGRATION_ACTOR = 'gallo-workshop-v3-migration';
const versionId = (landingPageId: string, version: number) => `${landingPageId}_v${version}`;

const isGalloWorkshopV3Published = (content: any) => {
  const blocks = content?.blocks || [];
  const partners = blocks.find((block: any) => block.id === 'gallo-partners');
  return Boolean(
    content?.theme?.primary === '#1741FF' &&
      partners?.layout?.variant === 'gallo_partners_scene' &&
      Array.isArray(partners?.data?.brands) && partners.data.brands.length === 21 &&
      Array.isArray(partners?.data?.insurers) && partners.data.insurers.length === 5 &&
      !blocks.some((block: any) => block.id === 'gallo-insurers') &&
      !blocks.some((block: any) => block.id === 'gallo-footer') &&
      content?.navigation?.some((item: any) => item.href === '#confianza')
  );
};

const ensurePublishedSnapshot = async (page: any) => {
  if (!page.published || !page.publishedVersion) return null;
  const existingSnapshot = await LandingPageVersion.findOne({ landingPageId: page._id, version: page.publishedVersion });
  if (existingSnapshot) return existingSnapshot;
  return LandingPageVersion.create({
    _id: versionId(page._id, page.publishedVersion),
    landingPageId: page._id,
    businessSlug: page.businessSlug,
    pageSlug: page.pageSlug,
    version: page.publishedVersion,
    title: page.title,
    content: page.published,
    action: 'publish',
    createdBy: `${MIGRATION_ACTOR}:preserve-existing-published`,
  });
};

export const migrateGalloWorkshopToV3 = async () => {
  const page = await LandingPage.findOne({ businessSlug: TARGET_BUSINESS_SLUG, pageSlug: TARGET_PAGE_SLUG });
  if (!page) throw new Error('Gallo landing page not found. Run the normal seed before the workshop v3 migration.');

  await ensurePublishedSnapshot(page);
  const before = {
    landingPageId: page._id,
    publishedVersion: page.publishedVersion || 0,
    publishedBlockIds: page.published?.blocks?.map((block: any) => block.id) || [],
    alreadyV3: isGalloWorkshopV3Published(page.published),
  };
  if (before.alreadyV3) return { changed: false, before, after: before };

  await updateDraftLandingPage({
    businessSlug: TARGET_BUSINESS_SLUG,
    pageSlug: TARGET_PAGE_SLUG,
    patch: { title: 'Gallo Autos Workshop', draft: galloLandingV3Seed },
  });

  const published = await publishLandingPage({ businessSlug: TARGET_BUSINESS_SLUG, pageSlug: TARGET_PAGE_SLUG, actor: MIGRATION_ACTOR });
  return {
    changed: true,
    before,
    after: {
      landingPageId: published?._id,
      publishedVersion: published?.publishedVersion || 0,
      publishedBlockIds: published?.published?.blocks?.map((block: any) => block.id) || [],
      alreadyV3: isGalloWorkshopV3Published(published?.published),
    },
  };
};
