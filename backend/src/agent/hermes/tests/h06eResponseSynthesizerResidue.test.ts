import { CustomerInteraction } from '../../../models/CustomerInteraction.model';
import { cleanupRunFixtures, connectMongo, disconnectMongo } from './h04TestUtils';

const run = async () => {
  await connectMongo();
  try {
    const conversationIds = (await CustomerInteraction.find({
      conversationId: /^hermes-h06e-synth-/,
    }).select({ conversationId: 1 }).lean().exec())
      .map((doc: any) => String(doc.conversationId))
      .filter(Boolean);
    for (const conversationId of [...new Set(conversationIds)]) {
      await cleanupRunFixtures(conversationId);
    }
    await CustomerInteraction.deleteMany({
      conversationId: /^hermes-h06e-synth-/,
    }).exec();
    const count = await CustomerInteraction.countDocuments({
      conversationId: /^hermes-h06e-synth-/,
    }).exec();
    if (count !== 0) {
      throw new Error(`Expected no H06E synthesizer residue, found ${count} interactions.`);
    }
    console.log('h06e-response-synthesizer-residue: PASS');
  } finally {
    await disconnectMongo();
  }
};

run().catch(async (error) => {
  console.error(error);
  await disconnectMongo().catch(() => undefined);
  process.exit(1);
});
