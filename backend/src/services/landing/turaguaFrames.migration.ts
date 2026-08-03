import { LandingPage } from '../../models/LandingPage.model';
import { LandingPageVersion } from '../../models/LandingPageVersion.model';
import { turaguaLandingSeed } from './landing.seed';
import { publishLandingPage, updateDraftLandingPage } from './landing.service';

const TARGET_BUSINESS_SLUG = 'turagua';
const TARGET_PAGE_SLUG = 'home';
const MIGRATION_ACTOR = 'turagua-frames-v2-migration';

const versionId = (landingPageId: string, version: number) => `${landingPageId}_v${version}`;

const isTuraguaFramesPublished = (content: any) => {
  const blocks = content?.blocks || [];
  const hero = blocks.find((block: any) => block.id === 'turagua-hero');
  const catalog = blocks.find((block: any) => block.id === 'turagua-catalog');
  const about = blocks.find((block: any) => block.id === 'turagua-about');
  const contact = blocks.find((block: any) => block.id === 'turagua-contact');
  const gallery = blocks.find((block: any) => block.id === 'turagua-gallery');
  const footer = blocks.find((block: any) => block.id === 'turagua-footer');

  return Boolean(
    hero?.frameHeight === 'viewport' &&
      Array.isArray(hero?.data?.stats) &&
      hero.data.stats.length > 0 &&
      !blocks.some((block: any) => block.id === 'turagua-stats') &&
      catalog?.frameHeight === 'viewport' &&
      catalog?.layout?.variant === 'turagua_catalog_frame' &&
      about?.frameHeight === 'viewport' &&
      contact?.frameHeight === 'viewport' &&
      gallery?.frameHeight === 'compact' &&
      footer?.frameHeight === 'compact'
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

export const migrateTuraguaLandingToFrames = async () => {
  const page = await LandingPage.findOne({
    businessSlug: TARGET_BUSINESS_SLUG,
    pageSlug: TARGET_PAGE_SLUG,
  });

  if (!page) {
    throw new Error('Turagua landing page not found. Seed turagua/home before running the frames migration.');
  }

  await ensurePublishedSnapshot(page);

  const before = {
    landingPageId: page._id,
    draftBlockIds: page.draft?.blocks?.map((block: any) => block.id) || [],
    publishedBlockIds: page.published?.blocks?.map((block: any) => block.id) || [],
    publishedVersion: page.publishedVersion || 0,
    alreadyFrames: isTuraguaFramesPublished(page.published),
  };

  if (before.alreadyFrames) {
    return {
      changed: false,
      before,
      after: before,
    };
  }

  await updateDraftLandingPage({
    businessSlug: TARGET_BUSINESS_SLUG,
    pageSlug: TARGET_PAGE_SLUG,
    patch: {
      title: 'Turagua Landing',
      draft: turaguaLandingSeed,
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
      draftBlockIds: published?.draft?.blocks?.map((block: any) => block.id) || [],
      publishedBlockIds: published?.published?.blocks?.map((block: any) => block.id) || [],
      publishedVersion: published?.publishedVersion || 0,
      alreadyFrames: isTuraguaFramesPublished(published?.published),
    },
  };
};
