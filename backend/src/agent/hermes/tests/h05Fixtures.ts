import { Case } from '../../../models/Case.model';
import { CatalogOffering } from '../../../models/CatalogOffering.model';
import { Customer } from '../../../models/Customer.model';
import { recordInboundMessage } from '../../../services/agentConversation.service';
import { cleanupRunFixtures } from './h04TestUtils';

export const enableH05TestFlags = () => {
  process.env.HERMES_ENABLED = 'true';
  process.env.HERMES_QA_VISIBLE_ENABLED = 'true';
  process.env.HERMES_QA_CANARY_PERCENT = '100';
  process.env.HERMES_QA_FAIL_OPEN = 'true';
  process.env.HERMES_QA_REQUIRE_NO_ACTIVE_PROCESS = 'true';
  process.env.HERMES_QA_MAX_REPLY_CHARS = '3000';
  process.env.HERMES_CONTEXT_ENABLED = 'true';
  process.env.HERMES_READ_BUSINESS_CONTEXT = 'true';
  process.env.HERMES_READ_CATALOG_CONTEXT = 'true';
  process.env.HERMES_READ_CUSTOMER_CONTEXT = 'true';
  process.env.HERMES_READ_CASE_CONTEXT = 'true';
  process.env.HERMES_READ_PROCESS_CONTEXT = 'true';
};

export const createH05Fixtures = async (conversationId: string, options: {
  activeCase?: boolean;
  knownCustomer?: boolean;
} = {}) => {
  await cleanupRunFixtures(conversationId);
  const customerId = `${conversationId}-customer`;
  const caseId = `${conversationId}-case`;
  const offeringA = `${conversationId}-offering-a`;
  const offeringB = `${conversationId}-offering-b`;

  await (CatalogOffering as any).create([
    {
      _id: offeringA,
      businessSlug: 'demo_test',
      active: true,
      publicVisible: true,
      name: 'Consulta basica H05',
      description: 'Consulta inicial.',
      durationMinutes: 60,
      pricing: { type: 'not_published', currency: 'PEN' },
    },
    {
      _id: offeringB,
      businessSlug: 'demo_test',
      active: true,
      publicVisible: true,
      name: 'Consulta extendida H05',
      description: 'Consulta con revision adicional.',
      durationMinutes: 90,
      pricing: { type: 'published', currency: 'PEN', amount: 120 },
    },
  ]);

  if (options.knownCustomer || options.activeCase) {
    await (Customer as any).create({
      _id: customerId,
      businessSlug: 'demo_test',
      displayName: 'Ricardo',
      phone: '+51999111222',
    });
  }

  if (options.activeCase) {
    await (Case as any).create({
      _id: caseId,
      businessSlug: 'demo_test',
      customerId,
      status: 'lead',
      statusGroup: 'pre_order',
      caseNumber: `H05-${conversationId}`,
      intent: { type: 'consultation_request', selectedOfferingId: offeringA },
    });
  }

  if (options.knownCustomer) {
    await recordInboundMessage({
      workflowId: conversationId,
      businessSlug: 'demo_test',
      conversationId,
      body: 'Mi nombre es Ricardo.',
      messageId: `${conversationId}:known-name`,
    });
  }

  return { customerId, caseId, offeringA, offeringB };
};

