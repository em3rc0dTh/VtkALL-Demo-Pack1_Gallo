import { Appointment } from '../../../models/Appointment.model';
import { CatalogOffering } from '../../../models/CatalogOffering.model';
import { Case } from '../../../models/Case.model';
import { Customer } from '../../../models/Customer.model';
import { CustomerInteraction } from '../../../models/CustomerInteraction.model';
import { IdempotencyRecord } from '../../../models/IdempotencyRecord.model';
import { ManagedEntity } from '../../../models/ManagedEntity.model';
import { ResourceReservation } from '../../../models/ResourceReservation.model';
import { TimelineEvent } from '../../../models/TimelineEvent.model';
import { connectMongo, disconnectMongo } from './h04TestUtils';

const run = async () => {
  await connectMongo();
  const prefix = /^hermes-h06g-/;
  const counts = {
    customerInteractions: await CustomerInteraction.countDocuments({ conversationId: prefix }),
    customers: await Customer.countDocuments({ _id: prefix }),
    managedEntities: await ManagedEntity.countDocuments({ _id: prefix }),
    cases: await Case.countDocuments({ _id: prefix }),
    timelineEvents: await TimelineEvent.countDocuments({ _id: prefix }),
    offerings: await CatalogOffering.countDocuments({ _id: prefix }),
    idempotencyRecords: await IdempotencyRecord.countDocuments({ idempotencyKey: prefix }),
    appointments: await Appointment.countDocuments({ _id: prefix }),
    resourceReservations: await ResourceReservation.countDocuments({ _id: prefix }),
  };
  await disconnectMongo();

  const dirty = Object.entries(counts).filter(([, count]) => count !== 0);
  if (dirty.length > 0) {
    throw new Error(`H06G fixture residue detected: ${JSON.stringify(counts)}`);
  }

  console.log(JSON.stringify({ ok: true, counts }, null, 2));
};

run().catch(async (error) => {
  console.error(error?.message || error);
  await disconnectMongo().catch(() => undefined);
  process.exit(1);
});
