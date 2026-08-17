import mongoose from 'mongoose';
import { env } from '../../config/env';
import { migrateGalloWorkshopToV3 } from '../../services/landing/galloWorkshopV3.migration';

const run = async () => {
  await mongoose.connect(env.mongoUri);
  try {
    const result = await migrateGalloWorkshopToV3();
    console.log(JSON.stringify(result, null, 2));
  } finally {
    await mongoose.disconnect();
  }
};

run().catch(async (error) => {
  console.error(error instanceof Error ? error.message : error);
  await mongoose.disconnect();
  process.exit(1);
});
