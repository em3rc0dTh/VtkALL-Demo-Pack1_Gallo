import { connectDB, disconnectDB } from './connect';
import { seedDatabase } from '../services/seed.service';
import { seedGalloBusiness } from '../services/galloSeed.service';

const runReset = async () => {
  await connectDB();
  try {
    const scope = process.env.SEED_BUSINESS_SLUG;
    if (scope === 'gallo') {
      await seedGalloBusiness(true);
    } else {
      await seedDatabase(true);
      await seedGalloBusiness(true);
    }
  } catch (error) {
    console.error('Reset error:', error);
  } finally {
    await disconnectDB();
  }
};

runReset();
