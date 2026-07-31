import { CustomerInteraction } from '../../../models/CustomerInteraction.model';
import { connectMongo, disconnectMongo } from './h04TestUtils';

const run = async () => {
  await connectMongo();
  try {
    const count = await CustomerInteraction.countDocuments({
      conversationId: /^hermes-h06c-dispatch-/,
    }).exec();
    if (count !== 0) {
      throw new Error(`Expected no H06C dispatch residue, found ${count} interactions.`);
    }
    console.log('h06c-skill-dispatch-residue: PASS');
  } finally {
    await disconnectMongo();
  }
};

run().catch(async (error) => {
  console.error(error);
  await disconnectMongo().catch(() => undefined);
  process.exit(1);
});
