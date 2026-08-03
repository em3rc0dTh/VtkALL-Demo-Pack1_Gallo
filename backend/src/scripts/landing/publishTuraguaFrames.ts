import mongoose from 'mongoose';
import { env } from '../../config/env';
import { migrateTuraguaLandingToFrames } from '../../services/landing/turaguaFrames.migration';

const run = async () => {
  await mongoose.connect(env.mongoUri);
  try {
    const result = await migrateTuraguaLandingToFrames();
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
