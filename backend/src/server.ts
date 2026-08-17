import app from './app';
import { env } from './config/env';
import { connectDB } from './db/connect';
import { warmUpConfiguredModel } from './agent/hermes/model/hermesInferenceRuntime.service';
import { validateHermesOperationalConfig } from './agent/hermes/operational/hermesOperationalConfig.service';
import { seedDatabase } from './services/seed.service';
import { galloLandingSeedRecord } from './services/landing/galloLanding.seed';
import { seedLandingPages } from './services/landing/landing.service';

const startServer = async () => {
  validateHermesOperationalConfig();
  await connectDB();
  if (process.env.AUTO_SEED_ON_START === 'true') {
    await seedDatabase(false);

    // The Gallo landing is a dedicated landing seed, while the legacy seed namespace
    // is still demo_test/turagua/all. Docker deployments may intentionally boot with
    // SEED_BUSINESS_SLUG=turagua, so ensure the Gallo landing exists independently.
    // seedLandingPages(reset=false) is idempotent and preserves existing draft/published
    // content created through the Landing Builder.
    await seedLandingPages([galloLandingSeedRecord], false);
  }
  
  app.listen(env.port, () => {
    console.log(`API running on http://localhost:${env.port}/api/v1`);
    console.log(`[hermes-runtime] buildId=${process.env.HERMES_BUILD_ID || 'unset'}`);
    console.log(`Swagger Docs available at http://localhost:${env.port}/api-docs`);
    void warmUpConfiguredModel();
  });
};

startServer();
