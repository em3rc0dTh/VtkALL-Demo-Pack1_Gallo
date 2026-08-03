import assert from 'node:assert/strict';
import http from 'node:http';
import mongoose from 'mongoose';
import app from '../../app';
import { env } from '../../config/env';
import { migrateTuraguaLandingToFrames } from '../../services/landing/turaguaFrames.migration';

const listen = () =>
  new Promise<http.Server>((resolve) => {
    const server = app.listen(0, () => resolve(server));
  });

const close = (server: http.Server) =>
  new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });

const urlFor = (server: http.Server, path: string) => {
  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('Test server did not bind to a local port.');
  }
  return `http://localhost:${address.port}${path}`;
};

const fetchPublicTuragua = async (server: http.Server) => {
  const response = await fetch(urlFor(server, '/api/v1/public/landing-pages/turagua/home'));
  assert.equal(response.status, 200);
  const payload = await response.json();
  return payload.data || payload;
};

const assertPublishedFrames = (payload: any) => {
  assert.equal(payload.landingPage.businessSlug, 'turagua');
  assert.equal(payload.landingPage.pageSlug, 'home');
  assert.deepEqual(payload.content, payload.landingPage.published);
  assert.ok(Number(payload.landingPage.publishedVersion) > 0);

  const blocks = payload.content.blocks;
  const byId = new Map(blocks.map((block: any) => [block.id, block]));
  assert.ok(!byId.has('turagua-stats'));

  const hero = byId.get('turagua-hero') as any;
  const catalog = byId.get('turagua-catalog') as any;
  const about = byId.get('turagua-about') as any;
  const contact = byId.get('turagua-contact') as any;
  const gallery = byId.get('turagua-gallery') as any;
  const footer = byId.get('turagua-footer') as any;

  assert.equal(hero.frameHeight, 'viewport');
  assert.ok(Array.isArray(hero.data.stats));
  assert.ok(hero.data.stats.length > 0);
  assert.equal(catalog.frameHeight, 'viewport');
  assert.equal(catalog.layout.variant, 'turagua_catalog_frame');
  assert.equal(about.frameHeight, 'viewport');
  assert.equal(about.layout.variant, 'turagua_about_frame');
  assert.equal(contact.frameHeight, 'viewport');
  assert.equal(contact.layout.variant, 'turagua_contact_frame');
  assert.equal(gallery.frameHeight, 'compact');
  assert.equal(footer.frameHeight, 'compact');
};

const run = async () => {
  await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 5000 });
  try {
    await migrateTuraguaLandingToFrames();

    const firstServer = await listen();
    let firstPayload: any;
    try {
      firstPayload = await fetchPublicTuragua(firstServer);
      assertPublishedFrames(firstPayload);
    } finally {
      await close(firstServer);
    }

    await mongoose.disconnect();
    await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 5000 });

    const secondServer = await listen();
    try {
      const secondPayload = await fetchPublicTuragua(secondServer);
      assertPublishedFrames(secondPayload);
      assert.equal(secondPayload.landingPage.publishedVersion, firstPayload.landingPage.publishedVersion);
    } finally {
      await close(secondServer);
    }

    console.log('Landing public frames integration passed.');
  } finally {
    await mongoose.disconnect();
  }
};

run().catch(async (error) => {
  console.error(error instanceof Error ? error.message : error);
  await mongoose.disconnect();
  process.exit(1);
});
