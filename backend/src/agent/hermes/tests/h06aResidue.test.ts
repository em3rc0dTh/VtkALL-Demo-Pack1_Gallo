import assert from 'assert';
import { Case } from '../../../models/Case.model';
import { CatalogOffering } from '../../../models/CatalogOffering.model';
import { Customer } from '../../../models/Customer.model';
import { CustomerInteraction } from '../../../models/CustomerInteraction.model';
import { ManagedEntity } from '../../../models/ManagedEntity.model';
import { cleanupRunFixtures, connectMongo, disconnectMongo } from './h04TestUtils';

const prefix = /^hermes-h06a-/;

const run = async () => {
  await connectMongo();

  const counts = {
    customerInteractions: await CustomerInteraction.countDocuments({ conversationId: prefix }),
    customers: await Customer.countDocuments({ _id: prefix }),
    managedEntities: await ManagedEntity.countDocuments({ _id: prefix }),
    cases: await Case.countDocuments({ _id: prefix }),
    offerings: await CatalogOffering.countDocuments({ _id: prefix }),
  };

  for (const [key, value] of Object.entries(counts)) {
    assert.equal(value, 0, `Fixture residue detected in ${key}: ${value}`);
  }

  await disconnectMongo();
  console.log('h06a-residue: PASS');
};

run().catch(async (error) => {
  console.error(error);
  await disconnectMongo().catch(() => undefined);
  process.exit(1);
});
