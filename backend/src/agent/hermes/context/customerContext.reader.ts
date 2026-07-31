import { Customer } from '../../../models/Customer.model';
import { CustomerPublicSummary } from './hermesContext.contract';
import { redactCustomer } from './contextRedaction.policy';

export const readCustomerContext = async ({
  businessSlug,
  customerId,
}: {
  businessSlug: string;
  customerId?: string;
}): Promise<CustomerPublicSummary | undefined> => {
  if (!customerId) return undefined;
  const customer: any = await Customer.findOne({ businessSlug, _id: customerId }).lean().exec();
  if (!customer || customer.businessSlug !== businessSlug) return undefined;
  return redactCustomer(customer);
};
