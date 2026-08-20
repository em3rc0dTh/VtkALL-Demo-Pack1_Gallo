import { connectDB, disconnectDB } from './connect';
import { seedDatabase } from '../services/seed.service';
import { seedGalloBusiness } from '../services/galloSeed.service';

const runSeed = async () => {
  await connectDB();
  try {
    const scope = process.env.SEED_BUSINESS_SLUG;
    if (scope === 'gallo') {
      await seedGalloBusiness(false);
    } else {
      await seedDatabase(false);
      await seedGalloBusiness(false);
    }
  } catch (error) {
    console.error('Seed error:', error);
  } finally {
    await disconnectDB();
  }
};

runSeed();
