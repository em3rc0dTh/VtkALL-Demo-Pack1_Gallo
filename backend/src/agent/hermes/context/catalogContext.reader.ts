import { CatalogOffering } from '../../../models/CatalogOffering.model';
import { PublicOfferingSummary } from './hermesContext.contract';
import { redactText } from './contextRedaction.policy';

export const readCatalogContext = async (businessSlug: string, limit = 20): Promise<PublicOfferingSummary[]> => {
  const offerings: any[] = await CatalogOffering.find({
    businessSlug,
    active: { $ne: false },
    publicVisible: { $ne: false },
  }).sort({ sortOrder: 1, createdAt: -1 }).limit(limit).lean().exec();

  return offerings
    .filter((offering) => offering.businessSlug === businessSlug)
    .map((offering) => ({
      id: String(offering._id),
      name: redactText(offering.name || offering.title),
      description: redactText(offering.description || offering.publicDescription),
      durationMinutes: typeof offering.durationMinutes === 'number'
        ? offering.durationMinutes
        : typeof offering.fulfillmentPolicy?.estimatedDurationMinutes === 'number'
          ? offering.fulfillmentPolicy.estimatedDurationMinutes
          : undefined,
      pricing: {
        type: offering.pricing?.amount || offering.price ? 'published' : 'not_published',
        currency: offering.pricing?.currency || offering.currency || 'PEN',
      },
      publicVisible: offering.publicVisible !== false,
      active: offering.active !== false,
    }));
};
