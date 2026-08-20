import { LandingPage } from '../../models/LandingPage.model';
import { LandingPageVersion } from '../../models/LandingPageVersion.model';
import { galloLandingSeed } from './galloLanding.seed';
import { publishLandingPage, updateDraftLandingPage } from './landing.service';

const TARGET_BUSINESS_SLUG = 'gallo';
const TARGET_PAGE_SLUG = 'home';
const MIGRATION_ACTOR = 'gallo-workshop-v2-migration';

const versionId = (landingPageId: string, version: number) => `${landingPageId}_v${version}`;

const isGalloWorkshopV2Published = (content: any) => {
  const blocks = content?.blocks || [];
  const insurerScene = blocks.find((block: any) => block.id === 'gallo-insurers');
  return Boolean(
    content?.theme?.primary === '#1741FF' &&
      content?.theme?.accent === '#FFD400' &&
      insurerScene?.frameHeight === 'viewport' &&
      insurerScene?.layout?.variant === 'gallo_insurance_scene' &&
      Array.isArray(content?.navigation) &&
      content.navigation.some((item: any) => item.href === '#aseguradoras')
  );
};

const ensurePublishedSnapshot = async (page: any) => {
  if (!page.published || !page.publishedVersion) return null;

  const existingSnapshot = await LandingPageVersion.findOne({
    landingPageId: page._id,
    version: page.publishedVersion,
  });
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

export const migrateGalloWorkshopToV2 = async () => {
  const page = await LandingPage.findOne({
    businessSlug: TARGET_BUSINESS_SLUG,
    pageSlug: TARGET_PAGE_SLUG,
  });

  if (!page) {
    throw new Error('Gallo landing page not found. Run the normal seed before the workshop v2 migration.');
  }

  await ensurePublishedSnapshot(page);

  const before = {
    landingPageId: page._id,
    publishedVersion: page.publishedVersion || 0,
    primary: page.published?.theme?.primary,
    publishedBlockIds: page.published?.blocks?.map((block: any) => block.id) || [],
    alreadyV2: isGalloWorkshopV2Published(page.published),
  };

  if (before.alreadyV2) {
    return { changed: false, before, after: before };
  }

  await updateDraftLandingPage({
    businessSlug: TARGET_BUSINESS_SLUG,
    pageSlug: TARGET_PAGE_SLUG,
    patch: {
      title: 'Gallo Autos Workshop',
      draft: galloLandingSeed,
    },
  });

  const published = await publishLandingPage({
    businessSlug: TARGET_BUSINESS_SLUG,
    pageSlug: TARGET_PAGE_SLUG,
    actor: MIGRATION_ACTOR,
  });

  return {
    changed: true,
    before,
    after: {
      landingPageId: published?._id,
      publishedVersion: published?.publishedVersion || 0,
      primary: published?.published?.theme?.primary,
      publishedBlockIds: published?.published?.blocks?.map((block: any) => block.id) || [],
      alreadyV2: isGalloWorkshopV2Published(published?.published),
    },
  };
};
