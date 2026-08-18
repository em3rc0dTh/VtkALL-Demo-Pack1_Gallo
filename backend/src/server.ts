import app from './app';
import { env } from './config/env';
import { connectDB } from './db/connect';
import { warmUpConfiguredModel } from './agent/hermes/model/hermesInferenceRuntime.service';
import { validateHermesOperationalConfig } from './agent/hermes/operational/hermesOperationalConfig.service';
import { seedDatabase } from './services/seed.service';
import { seedGalloBusiness } from './services/galloSeed.service';

const startServer = async () => {
  validateHermesOperationalConfig();
  await connectDB();
  if (process.env.AUTO_SEED_ON_START === 'true') {
    const scope = process.env.SEED_BUSINESS_SLUG;
    if (scope === 'gallo') {
      await seedGalloBusiness(false);
    } else {
      await seedDatabase(false);
      await seedGalloBusiness(false);
    }
  }
  
  app.listen(env.port, () => {
    console.log(`API running on http://localhost:${env.port}/api/v1`);
    console.log(`[hermes-runtime] buildId=${process.env.HERMES_BUILD_ID || 'unset'}`);
    console.log(`Swagger Docs available at http://localhost:${env.port}/api-docs`);
    void warmUpConfiguredModel();
  });
};

startServer();
