import { randomUUID } from 'crypto';
import { Customer } from '../../models/Customer.model';
import { DemoTestDomainError, assertRequired } from './errors';
import { ExecutionContext, executeIdempotentCommand } from './core';
import { CreateOrReuseCustomerInput, CreateOrReuseCustomerResult, GetCustomerByIdInput } from './types';

const normalizePhoneForDemoTest = (input: CreateOrReuseCustomerInput) => {
  const sourcePhone = input.normalizedPhone || input.phone || (input.contact as any)?.phone || (input.contact as any)?.number;
  if (!sourcePhone || typeof sourcePhone !== 'string') {
    return null;
  }

  const digits = sourcePhone.replace(/\D/g, '');
  if (!digits) {
    return null;
  }

  if (input.normalizedPhone) {
    return digits;
  }

  return digits.startsWith('51') ? digits : `51${digits}`;
};

const buildPhoneContact = (input: CreateOrReuseCustomerInput, normalizedPhone: string | null) => {
  if (!normalizedPhone && !input.phone && !input.contact) {
    return undefined;
  }

  const providedContact = typeof input.contact === 'object' && input.contact ? input.contact : {};
  const providedPhones = Array.isArray((providedContact as any).phones) ? (providedContact as any).phones : [];

  if (providedPhones.length > 0) {
    return {
      ...providedContact,
      phones: providedPhones.map((phone: any, index: number) => ({
        label: phone?.label || (index === 0 ? 'primary' : undefined),
        countryCode: phone?.countryCode || (input.businessSlug === 'demo_test' ? '+51' : undefined),
        number: phone?.number || input.phone,
        normalized: phone?.normalized || (index === 0 ? normalizedPhone : undefined),
        isWhatsapp: phone?.isWhatsapp,
        primary: phone?.primary ?? index === 0,
      })),
    };
  }

  return {
    ...providedContact,
    phones: normalizedPhone
      ? [
          {
            label: 'primary',
            countryCode: input.businessSlug === 'demo_test' ? '+51' : undefined,
            number: input.phone || (providedContact as any).number || normalizedPhone,
            normalized: normalizedPhone,
            primary: true,
          },
        ]
      : [],
  };
};

// Policy: customer reuse is scoped by businessSlug + normalized phone when a phone is present.
const createOrReuseCustomerOnce = async (
  input: CreateOrReuseCustomerInput,
  context?: ExecutionContext
): Promise<CreateOrReuseCustomerResult> => {
  assertRequired(input.businessSlug, 'businessSlug');
  assertRequired(input.name, 'name');

  const normalizedPhone = normalizePhoneForDemoTest(input);
  if (normalizedPhone) {
    const existingCustomer = await Customer.findOne({
      businessSlug: input.businessSlug,
      'contact.phones.normalized': normalizedPhone,
    }).exec();

    if (existingCustomer) {
      return { customer: existingCustomer, reused: true };
    }
  }

  const contact = buildPhoneContact(input, normalizedPhone);
  const customer = await (Customer as any).create({
    _id: `cus_${randomUUID()}`,
    businessSlug: input.businessSlug,
    type: 'person',
    name: input.name.trim(),
    ...(contact ? { contact } : {}),
    metadata: {
      ...(input.metadata || {}),
      ...(context?.idempotencyKey ? { idempotencyKey: context.idempotencyKey } : {}),
      ...(context?.correlationId ? { correlationId: context.correlationId } : {}),
    },
    status: 'active',
  });

  return { customer, reused: false };
};

export const createOrReuseCustomer = async (
  input: CreateOrReuseCustomerInput,
  context?: ExecutionContext
): Promise<CreateOrReuseCustomerResult> => {
  if (!context?.idempotencyKey) return createOrReuseCustomerOnce(input, context);

  const idempotent = await executeIdempotentCommand<CreateOrReuseCustomerInput, CreateOrReuseCustomerResult>({
    scope: 'customer.create_or_reuse',
    operation: 'createOrReuseCustomer',
    input,
    context,
    execute: () => createOrReuseCustomerOnce(input, context),
    entityRefs: (result) => [{ type: 'Customer', id: String((result.customer as any)._id) }],
  });

  return idempotent.result;
};

export const getCustomerById = async (input: GetCustomerByIdInput): Promise<unknown> => {
  assertRequired(input.businessSlug, 'businessSlug');
  assertRequired(input.customerId, 'customerId');

  const customer = await Customer.findOne({ _id: input.customerId, businessSlug: input.businessSlug }).exec();
  if (!customer) {
    throw new DemoTestDomainError('CUSTOMER_NOT_FOUND', 'Customer was not found.', {
      customerId: input.customerId,
      businessSlug: input.businessSlug,
    }, 404);
  }

  return customer;
};
