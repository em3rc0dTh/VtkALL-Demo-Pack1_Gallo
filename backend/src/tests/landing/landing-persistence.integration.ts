import assert from 'node:assert/strict';
import http from 'node:http';
import mongoose from 'mongoose';
import app from '../../app';
import { env } from '../../config/env';
import { LandingPage } from '../../models/LandingPage.model';
import { LandingPageVersion } from '../../models/LandingPageVersion.model';
import { landingSeeds } from '../../services/landing/landing.seed';
import {
  getPublicLandingPage,
  publishLandingPage,
  restoreLandingPageVersion,
  seedLandingPages,
  updateDraftLandingPage,
} from '../../services/landing/landing.service';

const adminToken = 'landing-integration-admin';
process.env.DEMO_TEST_ADMIN_WRITE_TOKEN = adminToken;

const listen = () =>
  new Promise<http.Server>((resolve) => {
    const server = app.listen(0, () => resolve(server));
  });

const urlFor = (server: http.Server, path: string) => {
  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('Test server did not bind to a local port.');
  }
  return `http://127.0.0.1:${address.port}${path}`;
};

const close = (server: http.Server) =>
  new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));

const findBlock = (content: any, id: string) => {
  const block = content.blocks.find((candidate: any) => candidate.id === id);
  assert.ok(block, `Expected block ${id}`);
  return block;
};

const assertRejectsUnsafeContent = async () => {
  const current = await LandingPage.findById('landing_turagua_home');
  assert.ok(current);

  const unknownTypeDraft = clone(current.draft);
  unknownTypeDraft.blocks.push({
    id: 'unknown',
    type: 'legacy_embed',
    enabled: true,
    order: 999,
    data: {},
  } as any);
  await assert.rejects(
    () => updateDraftLandingPage({ businessSlug: 'turagua', pageSlug: 'home', patch: { draft: unknownTypeDraft } }),
    /Invalid option|invalid/i
  );

  const scriptDraft = clone(current.draft);
  findBlock(scriptDraft, 'turagua-about').data.body = '<script>alert("x")</script>';
  await assert.rejects(
    () => updateDraftLandingPage({ businessSlug: 'turagua', pageSlug: 'home', patch: { draft: scriptDraft } }),
    /Unsafe landing content/i
  );

  const rawHtmlDraft = clone(current.draft);
  findBlock(rawHtmlDraft, 'turagua-about').data.rawHtml = '<div>arbitrary</div>';
  await assert.rejects(
    () => updateDraftLandingPage({ businessSlug: 'turagua', pageSlug: 'home', patch: { draft: rawHtmlDraft } }),
    /Unsafe landing content/i
  );
};

const assertEndpointMiddleware = async () => {
  const server = await listen();
  try {
    const publicResponse = await fetch(urlFor(server, '/api/v1/public/landing-pages/turagua/home'));
    assert.equal(publicResponse.status, 200);

    const blockedResponse = await fetch(urlFor(server, '/api/v1/admin/landing-pages/turagua/home'), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Blocked title' }),
    });
    assert.equal(blockedResponse.status, 403);

    const allowedResponse = await fetch(urlFor(server, '/api/v1/admin/landing-pages/turagua/home'), {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-Demo-Test-Admin-Token': adminToken,
      },
      body: JSON.stringify({ title: 'Turagua Landing Endpoint Verified' }),
    });
    assert.equal(allowedResponse.status, 200);
  } finally {
    await close(server);
  }
};

const run = async () => {
  await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 5000 });
  try {
    await LandingPage.deleteMany({ businessSlug: { $in: ['demo_test', 'turagua'] } });
    await LandingPageVersion.deleteMany({ businessSlug: { $in: ['demo_test', 'turagua'] } });

    await seedLandingPages(landingSeeds.filter((seed) => seed.businessSlug === 'demo_test'), false);
    await seedLandingPages(landingSeeds.filter((seed) => seed.businessSlug === 'turagua'), false);

    const initialTuragua = await getPublicLandingPage('turagua', 'home');
    const initialDemo = await getPublicLandingPage('demo_test', 'home');
    assert.ok(initialTuragua?.content);
    assert.ok(initialDemo?.content);
    assert.notEqual(
      findBlock(initialTuragua.content, 'turagua-hero').data.title,
      findBlock(initialDemo.content, 'demo-hero').data.title,
      'businessSlug isolation should keep demo_test and turagua content separate'
    );

    const draftV2 = clone(initialTuragua.content);
    findBlock(draftV2, 'turagua-hero').data.title = 'Draft title only';
    const updatedDraft = await updateDraftLandingPage({
      businessSlug: 'turagua',
      pageSlug: 'home',
      patch: { draft: draftV2 },
    });
    assert.equal(findBlock(updatedDraft.draft, 'turagua-hero').data.title, 'Draft title only');

    const publicBeforePublish = await getPublicLandingPage('turagua', 'home');
    assert.notEqual(findBlock(publicBeforePublish?.content, 'turagua-hero').data.title, 'Draft title only');

    const publishedV2 = await publishLandingPage({ businessSlug: 'turagua', pageSlug: 'home', actor: 'integration-test' });
    assert.equal(publishedV2.publishedVersion, 2);

    const publicAfterPublish = await getPublicLandingPage('turagua', 'home');
    assert.equal(findBlock(publicAfterPublish?.content, 'turagua-hero').data.title, 'Draft title only');

    const draftV3 = clone(publicAfterPublish?.content);
    findBlock(draftV3, 'turagua-hero').data.title = 'Unpublished draft v3';
    await updateDraftLandingPage({ businessSlug: 'turagua', pageSlug: 'home', patch: { draft: draftV3 } });

    const publicStillV2 = await getPublicLandingPage('turagua', 'home');
    assert.equal(findBlock(publicStillV2?.content, 'turagua-hero').data.title, 'Draft title only');

    const restoredDraft = await restoreLandingPageVersion({
      businessSlug: 'turagua',
      pageSlug: 'home',
      version: 1,
      actor: 'integration-test',
    });
    assert.notEqual(findBlock(restoredDraft.draft, 'turagua-hero').data.title, 'Unpublished draft v3');

    const publicBeforeRestorePublish = await getPublicLandingPage('turagua', 'home');
    assert.equal(findBlock(publicBeforeRestorePublish?.content, 'turagua-hero').data.title, 'Draft title only');

    const restoredPublished = await publishLandingPage({ businessSlug: 'turagua', pageSlug: 'home', actor: 'integration-test' });
    assert.equal(restoredPublished.publishedVersion, 4);

    const publicAfterRestorePublish = await getPublicLandingPage('turagua', 'home');
    assert.equal(
      findBlock(publicAfterRestorePublish?.content, 'turagua-hero').data.title,
      findBlock(initialTuragua.content, 'turagua-hero').data.title
    );

    await LandingPage.create({
      _id: 'landing_turagua_secondary',
      businessSlug: 'turagua',
      pageSlug: 'secondary',
      title: 'Secondary Page',
      status: 'published',
      draft: initialDemo.content,
      published: initialDemo.content,
      publishedVersion: 1,
    });
    await LandingPageVersion.create({
      _id: 'landing_turagua_secondary_v1',
      landingPageId: 'landing_turagua_secondary',
      businessSlug: 'turagua',
      pageSlug: 'secondary',
      version: 1,
      title: 'Secondary Page',
      content: initialDemo.content,
      action: 'seed',
      createdBy: 'integration-test',
    });
    const secondary = await getPublicLandingPage('turagua', 'secondary');
    assert.ok(secondary?.content);
    assert.notEqual(
      findBlock(secondary.content, 'demo-hero').data.title,
      findBlock(publicAfterRestorePublish?.content, 'turagua-hero').data.title,
      'pageSlug isolation should keep secondary page content separate'
    );

    await mongoose.disconnect();
    await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 5000 });
    const persisted = await getPublicLandingPage('turagua', 'home');
    assert.equal(
      findBlock(persisted?.content, 'turagua-hero').data.title,
      findBlock(initialTuragua.content, 'turagua-hero').data.title,
      'published landing should persist across reconnect'
    );

    await assertRejectsUnsafeContent();
    await assertEndpointMiddleware();

    console.log('Landing persistence integration passed.');
  } finally {
    await mongoose.disconnect();
  }
};

run().catch(async (error) => {
  console.error(error instanceof Error ? error.message : error);
  await mongoose.disconnect();
  process.exit(1);
});
