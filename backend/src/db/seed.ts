import { connectDB, disconnectDB } from './connect';
import { seedDatabase } from '../services/seed.service';

const runSeed = async () => {
  await connectDB();
  try {
    await seedDatabase(false);
  } catch (error) {
    console.error('Seed error:', error);
  } finally {
    await disconnectDB();
  }
};

runSeed();
