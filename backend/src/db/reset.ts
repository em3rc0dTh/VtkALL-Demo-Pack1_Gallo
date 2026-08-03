import { connectDB, disconnectDB } from './connect';
import { seedDatabase } from '../services/seed.service';

const runReset = async () => {
  await connectDB();
  try {
    await seedDatabase(true);
  } catch (error) {
    console.error('Reset error:', error);
  } finally {
    await disconnectDB();
  }
};

runReset();
