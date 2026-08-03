import { Case } from '../../../models/Case.model';
import { CustomerInteraction } from '../../../models/CustomerInteraction.model';
import { CasePublicSummary } from './hermesContext.contract';
import { redactText } from './contextRedaction.policy';

const terminalStatuses = new Set(['closed', 'cancelled', 'completed', 'APPOINTMENT_BOOKED', 'CANCELLED']);

const toCaseSummary = (item: any): CasePublicSummary | undefined => {
  if (!item) return undefined;
  return {
    caseId: String(item._id),
    caseNumber: item.caseNumber,
    status: item.status,
    statusGroup: item.statusGroup,
    intent: {
      type: item.intent?.type,
      summary: redactText(item.intent?.summary || item.summary),
      selectedOfferingId: item.intent?.selectedOfferingId || item.selectedOfferingId,
    },
    flags: {
      hasAppointment: Boolean(item.appointmentId || item.flags?.hasAppointment),
    },
  };
};

export const readCaseContext = async ({
  businessSlug,
  conversationId,
  customerId,
  caseId,
}: {
  businessSlug: string;
  conversationId: string;
  customerId?: string;
  caseId?: string;
}): Promise<CasePublicSummary | undefined> => {
  if (caseId) {
    const explicit: any = await Case.findOne({ businessSlug, _id: caseId }).lean().exec();
    if (explicit?.businessSlug === businessSlug) return toCaseSummary(explicit);
  }

  const linked: any = await CustomerInteraction.findOne({
    businessSlug,
    conversationId,
    caseId: { $exists: true, $nin: [null, conversationId] },
  }).sort({ createdAt: -1 }).lean().exec();
  if (linked?.caseId) {
    const linkedCase: any = await Case.findOne({ businessSlug, _id: linked.caseId }).lean().exec();
    if (linkedCase?.businessSlug === businessSlug && !terminalStatuses.has(String(linkedCase.status))) return toCaseSummary(linkedCase);
  }

  if (customerId) {
    const active: any = await Case.findOne({
      businessSlug,
      customerId,
      status: { $nin: [...terminalStatuses] },
    }).sort({ updatedAt: -1, createdAt: -1 }).lean().exec();
    if (active?.businessSlug === businessSlug) return toCaseSummary(active);
  }

  return undefined;
};
