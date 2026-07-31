import { Appointment } from '../models/Appointment.model';
import { Case } from '../models/Case.model';
import { Customer } from '../models/Customer.model';
import { CustomerInteraction } from '../models/CustomerInteraction.model';
import { ManagedEntity } from '../models/ManagedEntity.model';
import { linkConversationToCase, linkConversationToCustomer } from './agentConversation.service';

const normalizeIdentityText = (value: string) =>
  String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const phoneVariantsFrom = (message: string) => {
  const digits = String(message || '').match(/\b(?:\+?\d[\d\s().-]{6,}\d)\b/)?.[0]?.replace(/\D/g, '');
  if (!digits) return [];
  const variants = new Set<string>([digits]);
  if (digits.startsWith('51')) variants.add(digits.slice(2));
  if (!digits.startsWith('51')) variants.add(`51${digits}`);
  return [...variants].filter((item) => item.length >= 7);
};

const documentFrom = (message: string) =>
  String(message || '').match(/\b(?:dni|documento)\s*(?:es|:)?\s*(\d{8,12})\b/i)?.[1];

const plateFrom = (message: string) =>
  String(message || '').match(/\b(?:placa)\s*(?:es|:)?\s*([A-Z0-9]{2,4}[-\s]?[A-Z0-9]{2,4})\b/i)?.[1]?.replace(/\s+/g, '').toUpperCase();

const nameFrom = (message: string) =>
  String(message || '').match(/\b(?:soy|me llamo|mi nombre es)\s+([A-Za-zÁÉÍÓÚÜÑáéíóúüñ]{2,}(?:\s+[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]{2,}){0,2})/i)?.[1]?.trim();

const latestCaseForCustomer = async (businessSlug: string, customerId: string, managedEntityId?: string) =>
  Case.findOne({
    businessSlug,
    customerId,
    ...(managedEntityId ? { managedEntityId } : {}),
  }).sort({ updatedAt: -1, createdAt: -1 }).lean().exec();

const recoveredCustomerDataFrom = (customer?: any, managedEntity?: any) => {
  if (!customer && !managedEntity) return undefined;
  const fullName = String(customer?.displayName || customer?.name || '').trim();
  const parts = fullName.split(/\s+/).filter(Boolean);
  const phone = String(
    customer?.contact?.phones?.find((entry: any) => entry?.primary)?.normalized
    || customer?.contact?.phones?.[0]?.normalized
    || customer?.contact?.phones?.[0]?.number
    || customer?.contact?.phone
    || customer?.phone
    || ''
  ).replace(/\D/g, '');
  const data: Record<string, string> = {};
  if (customer?.firstName || parts[0]) data.firstName = String(customer?.firstName || parts[0]).trim();
  if (customer?.lastName || parts.length > 1) data.lastName = String(customer?.lastName || parts.slice(1).join(' ')).trim();
  if (phone) data.phone = phone;
  const managedEntityDisplayName = String(
    managedEntity?.displayName
    || managedEntity?.name
    || managedEntity?.summary
    || managedEntity?.data?.plate
    || ''
  ).trim();
  if (managedEntityDisplayName) data.managedEntityDisplayName = managedEntityDisplayName;
  return Object.keys(data).length ? data : undefined;
};

export const recoverIdentityForConversation = async (input: {
  businessSlug: string;
  conversationId: string;
  message: string;
}) => {
  const message = String(input.message || '');
  const phoneVariants = phoneVariantsFrom(message);
  const document = documentFrom(message);
  const plate = plateFrom(message);
  const name = nameFrom(message);
  const lookupAttempted = Boolean(phoneVariants.length || document || plate || name);

  let customer: any;
  let managedEntity: any;

  if (phoneVariants.length) {
    customer = await Customer.findOne({
      businessSlug: input.businessSlug,
      $or: [
        { 'contact.phones.normalized': { $in: phoneVariants } },
        { 'contact.phones.number': { $in: phoneVariants } },
        { 'contact.phone': { $in: phoneVariants } },
      ],
    }).sort({ updatedAt: -1, createdAt: -1 }).lean().exec();
  }

  if (!customer && document) {
    customer = await Customer.findOne({
      businessSlug: input.businessSlug,
      $or: [
        { 'document.value': document },
        { dni: document },
        { documentNumber: document },
      ],
    }).sort({ updatedAt: -1, createdAt: -1 }).lean().exec();
  }

  if (plate) {
    const escapedPlate = plate.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    managedEntity = await ManagedEntity.findOne({
      businessSlug: input.businessSlug,
      $or: [
        { 'data.plate': plate },
        { displayName: new RegExp(escapedPlate, 'i') },
        { summary: new RegExp(escapedPlate, 'i') },
      ],
    }).sort({ updatedAt: -1, createdAt: -1 }).lean().exec();
    if (managedEntity?.customerId && !customer) {
      customer = await Customer.findOne({ businessSlug: input.businessSlug, _id: managedEntity.customerId }).lean().exec();
    }
  }

  if (!customer && name) {
    const normalizedName = normalizeIdentityText(name);
    const candidates = await Customer.find({ businessSlug: input.businessSlug })
      .sort({ updatedAt: -1, createdAt: -1 })
      .limit(25)
      .lean()
      .exec();
    const matches = candidates.filter((candidate: any) =>
      normalizeIdentityText(String(candidate.name || candidate.displayName || '')).includes(normalizedName)
    );
    if (matches.length === 1) customer = matches[0];
  }

  if (!customer?._id) {
    return lookupAttempted
      ? { lookupAttempted: true, lookupMatched: false }
      : undefined;
  }

  if (!managedEntity?._id) {
    managedEntity = await ManagedEntity.findOne({
      businessSlug: input.businessSlug,
      customerId: customer._id,
    }).sort({ updatedAt: -1, createdAt: -1 }).lean().exec();
  }

  const latestCase: any = await latestCaseForCustomer(input.businessSlug, String(customer._id), managedEntity?._id ? String(managedEntity._id) : undefined);
  const latestAppointment: any = await Appointment.findOne({
    businessSlug: input.businessSlug,
    customerId: customer._id,
  }).sort({ scheduledStart: -1, createdAt: -1 }).lean().exec();

  await linkConversationToCustomer({
    businessSlug: input.businessSlug,
    conversationId: input.conversationId,
    customerId: String(customer._id),
  }).catch(() => undefined);

  if (latestCase?._id) {
    await linkConversationToCase({
      businessSlug: input.businessSlug,
      conversationId: input.conversationId,
      caseId: String(latestCase._id),
    }).catch(() => undefined);
  }

  return {
    customerId: String(customer._id),
    lookupAttempted: true,
    lookupMatched: true,
    managedEntityId: managedEntity?._id ? String(managedEntity._id) : undefined,
    caseId: latestCase?._id ? String(latestCase._id) : undefined,
    customerName: customer.name || customer.displayName,
    managedEntityName: managedEntity?.displayName || managedEntity?.summary,
    latestAppointmentStatus: latestAppointment?.status,
    recoveredCustomerData: recoveredCustomerDataFrom(customer, managedEntity),
  };
};

export const resolveLinkedIdentityForConversation = async (input: {
  businessSlug: string;
  conversationId: string;
}) => {
  const linked: any = await CustomerInteraction.findOne({
    businessSlug: input.businessSlug,
    conversationId: input.conversationId,
    customerId: { $exists: true, $ne: null },
  }).sort({ updatedAt: -1, createdAt: -1 }).lean().exec();
  if (!linked?.customerId) return undefined;

  const customer: any = await Customer.findOne({
    businessSlug: input.businessSlug,
    _id: linked.customerId,
  }).lean().exec();
  if (!customer?._id) return undefined;

  const managedEntity: any = linked.managedEntityId
    ? await ManagedEntity.findOne({
      businessSlug: input.businessSlug,
      _id: linked.managedEntityId,
      customerId: customer._id,
    }).lean().exec()
    : await ManagedEntity.findOne({
      businessSlug: input.businessSlug,
      customerId: customer._id,
    }).sort({ updatedAt: -1, createdAt: -1 }).lean().exec();

  const latestCase: any = linked.caseId && linked.caseId !== input.conversationId
    ? await Case.findOne({
      businessSlug: input.businessSlug,
      _id: linked.caseId,
      customerId: customer._id,
    }).lean().exec()
    : await latestCaseForCustomer(input.businessSlug, String(customer._id), managedEntity?._id ? String(managedEntity._id) : undefined);

  return {
    lookupAttempted: false,
    lookupMatched: true,
    customerId: String(customer._id),
    managedEntityId: managedEntity?._id ? String(managedEntity._id) : undefined,
    caseId: latestCase?._id ? String(latestCase._id) : undefined,
    customerName: customer.name || customer.displayName,
    managedEntityName: managedEntity?.displayName || managedEntity?.summary,
    recoveredCustomerData: recoveredCustomerDataFrom(customer, managedEntity),
  };
};
