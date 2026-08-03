import { CustomerInteraction } from '../../../models/CustomerInteraction.model';
import { cleanupRunFixtures, connectMongo, disconnectMongo } from './h04TestUtils';

const run = async () => {
  await connectMongo();
  try {
    const conversationIds = (await CustomerInteraction.find({
      conversationId: /^hermes-h06d-specialist-/,
    }).select({ conversationId: 1 }).lean().exec())
      .map((doc: any) => String(doc.conversationId))
      .filter(Boolean);
    for (const conversationId of [...new Set(conversationIds)]) {
      await cleanupRunFixtures(conversationId);
    }
    const count = await CustomerInteraction.countDocuments({
      conversationId: /^hermes-h06d-specialist-/,
    }).exec();
    if (count !== 0) {
      throw new Error(`Expected no H06D specialist residue, found ${count} interactions.`);
    }
    console.log('h06d-scheduling-specialist-residue: PASS');
  } finally {
    await disconnectMongo();
  }
};

run().catch(async (error) => {
  console.error(error);
  await disconnectMongo().catch(() => undefined);
  process.exit(1);
});
