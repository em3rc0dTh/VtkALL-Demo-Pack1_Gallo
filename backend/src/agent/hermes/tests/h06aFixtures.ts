import { CatalogOffering } from '../../../models/CatalogOffering.model';
import { CustomerInteraction } from '../../../models/CustomerInteraction.model';
import { cleanupRunFixtures, connectMongo } from './h04TestUtils';

export const enableH06ATestFlags = () => {
  process.env.HERMES_SCHEDULING_DRY_RUN_ENABLED = 'true';
  process.env.HERMES_SCHEDULING_TRANSACTIONAL_ENABLED = 'false';
  process.env.HERMES_SCHEDULING_CANARY_PERCENT = '0';
  process.env.HERMES_CONTEXT_ENABLED = 'true';
  process.env.HERMES_READ_BUSINESS_CONTEXT = 'true';
  process.env.HERMES_READ_CATALOG_CONTEXT = 'true';
  process.env.HERMES_READ_CUSTOMER_CONTEXT = 'true';
  process.env.HERMES_READ_CASE_CONTEXT = 'true';
  process.env.HERMES_READ_PROCESS_CONTEXT = 'true';
};

export const createH06AFixtures = async (conversationId: string) => {
  await connectMongo();
  await cleanupRunFixtures(conversationId);
  await (CatalogOffering as any).create([
    {
      _id: `${conversationId}-off-basic`,
      businessSlug: 'demo_test',
      active: true,
      publicVisible: true,
      name: 'Consulta basica',
      description: 'Consulta inicial',
      durationMinutes: 60,
      pricing: { currency: 'PEN' },
    },
    {
      _id: `${conversationId}-off-extended`,
      businessSlug: 'demo_test',
      active: true,
      publicVisible: true,
      name: 'Consulta extendida',
      description: 'Consulta avanzada',
      durationMinutes: 90,
      pricing: { currency: 'PEN' },
    },
  ]);
  return {
    offeringA: `${conversationId}-off-basic`,
    offeringB: `${conversationId}-off-extended`,
  };
};

export const countH06AShadowRows = (conversationId: string) =>
  CustomerInteraction.countDocuments({
    businessSlug: 'demo_test',
    conversationId,
    visibility: 'shadow',
    interactionType: 'system_event',
    'metadata.runtimeMode': 'scheduling_dry_run',
  });
