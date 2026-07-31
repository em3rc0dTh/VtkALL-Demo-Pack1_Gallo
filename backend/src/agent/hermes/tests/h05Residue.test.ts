import { Case } from '../../../models/Case.model';
import { CatalogOffering } from '../../../models/CatalogOffering.model';
import { Customer } from '../../../models/Customer.model';
import { CustomerInteraction } from '../../../models/CustomerInteraction.model';
import { ManagedEntity } from '../../../models/ManagedEntity.model';
import { assert, connectMongo, disconnectMongo, makeResult, printSummary } from './h04TestUtils';

const run = async () => {
  await connectMongo();
  const rx = /^hermes-h05-/;
  const results = [
    await makeResult('H05 fixture residue is zero', async () => {
      const counts = {
        CustomerInteraction: await CustomerInteraction.countDocuments({ businessSlug: 'demo_test', conversationId: rx }),
        Customer: await Customer.countDocuments({ businessSlug: 'demo_test', _id: rx }),
        ManagedEntity: await ManagedEntity.countDocuments({ businessSlug: 'demo_test', _id: rx }),
        Case: await Case.countDocuments({ businessSlug: 'demo_test', _id: rx }),
        CatalogOffering: await CatalogOffering.countDocuments({ businessSlug: 'demo_test', _id: rx }),
      };
      assert(Object.values(counts).every((value) => value === 0), `H05 residue found: ${JSON.stringify(counts)}`);
    }),
  ];
  await disconnectMongo();
  printSummary('HERMES-05 Fixture Residue', results, {});
};

run().catch(async (error) => {
  console.error(error?.message || error);
  await disconnectMongo();
  process.exit(1);
});

