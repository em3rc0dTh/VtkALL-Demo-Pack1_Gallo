import { BusinessProfile } from '../../models/BusinessProfile.model';
import { Appointment } from '../../models/Appointment.model';
import { CatalogOffering } from '../../models/CatalogOffering.model';
import { CustomerInteraction } from '../../models/CustomerInteraction.model';
import { ResourceReservation } from '../../models/ResourceReservation.model';
import { temporalMcpClient } from '../../mcp/temporal/client/temporalMcpClient';
import { AgentProcessContext } from '../../mcp/temporal/schemas/agentProcessContext';
import { resolveActiveWorkflowForConversation } from '../../services/agentConversation.service';
import { AgentBusinessContext, ConversationContext } from '../context/agentContext';

const DEFAULT_TIMEZONE = 'America/Lima';

const normalize = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const tokensFrom = (value?: string) =>
  normalize(String(value || ''))
    .split(/[^a-z0-9]+/i)
    .map((token) => token.trim())
    .filter(Boolean);

const priceLabelFor = (offering: any) => {
  const display = offering?.price?.display || offering?.priceLabel || offering?.price;
  if (display) return String(display);

  const policy = offering?.pricingPolicy || {};
  const amount = policy.amount ?? policy.fromAmount ?? policy.baseAmount;
  if (amount !== undefined && amount !== null && amount !== '') {
    return `${policy.currency || ''} ${amount}`.trim();
  }

  return undefined;
};

const summarizeOffering = (offering: any) => ({
  id: String(offering._id),
  name: String(offering.name || offering._id),
  description: offering.description,
  priceLabel: priceLabelFor(offering),
  durationMinutes: Number(offering.durationMinutes || offering.fulfillmentPolicy?.estimatedDurationMinutes || 0) || undefined,
});

const businessDescriptionFromProfile = (profile: any) => {
  const summary = String(
    profile?.about?.summary
    || profile?.description
    || profile?.landing?.about?.description
    || ''
  ).trim();
  const specialties = Array.isArray(profile?.about?.specialties)
    ? profile.about.specialties.map((item: unknown) => String(item || '').trim()).filter(Boolean).slice(0, 5)
    : [];
  const promo = Array.isArray(profile?.promotions) && profile.promotions[0]
    ? String(profile.promotions[0]?.detail || profile.promotions[0]?.title || '').trim()
    : '';

  return [
    summary,
    specialties.length ? `Especialidades: ${specialties.join(', ')}.` : '',
    promo ? `Promocion vigente: ${promo}.` : '',
  ].filter(Boolean).join(' ');
};

const businessPersonalityFromProfile = (profile: any) => {
  if (String(profile?.businessSlug || '') === 'turagua') {
    return [
      'Hablas en espanol natural, cercano y profesional.',
      'Suena como una asesora real de taller, no como un bot.',
      'Primero respondes la duda actual y luego retomas la reserva con suavidad.',
      'Cuando el cliente no sabe que servicio necesita, orientas segun sintomas o uso del vehiculo.',
      'Si piden algo fuera del catalogo, lo aclaras con amabilidad y rediriges a los servicios reales de Turagua.',
      'Evitas rigidez, repeticiones y frases mecanicas.',
    ].join('\n');
  }

  return profile?.agent?.personality;
};

export class AgentCapabilityGateway {
  async getBusinessContext(businessSlug: string): Promise<AgentBusinessContext> {
    const profile: any = await BusinessProfile.findOne({ businessSlug }).lean().exec();
    const catalog = await this.searchCatalog({ businessSlug });

    return {
      businessSlug,
      business: {
        name: profile?.businessName || businessSlug,
        description: businessDescriptionFromProfile(profile),
        timezone: profile?.timezone || profile?.brand?.timezone || DEFAULT_TIMEZONE,
      },
      agent: {
        name: profile?.agent?.name || profile?.agent?.displayName || profile?.agent?.role || 'Iris',
        role: profile?.agent?.role || 'asistente de reservas',
        personality: businessPersonalityFromProfile(profile),
      },
      capabilities: [
        'search_catalog',
        'get_offering_details',
        'start_schedule_consultation',
        'continue_schedule_consultation',
        'get_current_process_state',
      ],
      catalogSummary: catalog,
    };
  }

  async getConversationContext(input: {
    businessSlug: string;
    conversationId?: string;
    workflowId?: string;
    channel?: string;
  }): Promise<ConversationContext> {
    const conversationId = input.conversationId || input.workflowId || `web_${input.businessSlug}`;
    const query: any = {
      businessSlug: input.businessSlug,
      conversationId,
    };

    const recent = await CustomerInteraction.find(query)
      .sort({ createdAt: -1 })
      .limit(12)
      .lean()
      .exec();

    return {
      conversationId,
      businessSlug: input.businessSlug,
      channel: input.channel || 'web_agent',
      customerIdentity: {
        identityStatus: 'anonymous',
      },
      recentMessages: recent.reverse().map((message: any) => {
        const role: 'user' | 'assistant' = message.actorType === 'customer' || message.direction === 'inbound' ? 'user' : 'assistant';
        return {
          role,
          content: String(message.body || message.message || ''),
          createdAt: new Date(message.createdAt || Date.now()).toISOString(),
        };
      }).filter((message) => message.content),
    };
  }

  async searchCatalog(input: { businessSlug: string; query?: string }) {
    const offerings = await CatalogOffering.find({
      businessSlug: input.businessSlug,
      active: true,
      publicVisible: true,
    }).sort({ category: 1, name: 1 }).lean().exec();

    const normalizedQuery = normalize(String(input.query || '').trim());
    const filtered = normalizedQuery
      ? offerings.filter((offering: any) => {
        const searchable = normalize(`${offering._id || ''} ${offering.name || ''} ${offering.description || ''}`);
        return searchable.includes(normalizedQuery);
      })
      : offerings;

    return filtered.map(summarizeOffering);
  }

  async getOfferingDetails(input: { businessSlug: string; offeringId?: string; query?: string }) {
    const catalog = await CatalogOffering.find({
      businessSlug: input.businessSlug,
      active: true,
      publicVisible: true,
    }).sort({ category: 1, name: 1 }).lean().exec();

    const normalizedQuery = normalize(String(input.query || '').trim());
    const queryTokens = tokensFrom(input.query);
    const offering = catalog.find((item: any) => String(item._id) === input.offeringId)
      || catalog.find((item: any) => normalizedQuery && normalize(String(item.name || '')).includes(normalizedQuery))
      || catalog.find((item: any) => queryTokens.length > 1 && queryTokens.every((token) => normalize(String(item.name || '')).includes(token)));

    return offering ? summarizeOffering(offering) : undefined;
  }

  async getProcessContext(input: { workflowId?: string }) {
    if (!input.workflowId) return undefined;
    return temporalMcpClient.getScheduleConsultationContext({ workflowId: input.workflowId });
  }

  async resolveActiveProcess(input: { businessSlug: string; conversationId?: string }) {
    if (!input.conversationId) return undefined;
    return resolveActiveWorkflowForConversation({
      businessSlug: input.businessSlug,
      conversationId: input.conversationId,
    });
  }

  async startProcess(input: {
    processType: 'schedule_consultation';
    businessSlug: string;
    conversationId: string;
    offeringId?: string;
    customerMessage?: string;
  }) {
    return temporalMcpClient.startScheduleConsultation({
      businessSlug: input.businessSlug,
      conversationId: input.conversationId,
      offeringId: input.offeringId,
      customerMessage: input.customerMessage,
    });
  }

  async continueProcess(input: {
    process: AgentProcessContext;
    conversationId: string;
    action: string;
    data?: Record<string, unknown>;
  }) {
    if (!input.process.allowedActions.includes(input.action)) {
      return { skipped: true, reason: 'ACTION_NOT_ALLOWED', allowedActions: input.process.allowedActions };
    }

    const allowed = ['submit_offering_selection', 'submit_customer_information', 'submit_date_preference', 'submit_slot_selection', 'cancel_process'];
    if (!allowed.includes(input.action)) return { skipped: true, reason: 'ACTION_NOT_SUPPORTED' };

    return temporalMcpClient.continueScheduleConsultation({
      workflowId: input.process.process.workflowId,
      conversationId: input.conversationId,
      action: input.action as any,
      data: input.data,
    });
  }

  async findBookedArtifactsByWorkflow(input: { businessSlug: string; workflowId?: string }) {
    if (!input.workflowId) return undefined;
    const reservation: any = await ResourceReservation.findOne({
      businessSlug: input.businessSlug,
      workflowId: input.workflowId,
      status: 'booked',
    }).sort({ createdAt: -1 }).lean().exec();
    if (!reservation?._id) return undefined;

    const appointment: any = await Appointment.findOne({
      businessSlug: input.businessSlug,
      resourceReservationId: reservation._id,
    }).sort({ createdAt: -1 }).lean().exec();
    if (!appointment?._id) return undefined;

    return { reservation, appointment };
  }

}

export const agentCapabilityGateway = new AgentCapabilityGateway();
