import { ManagedEntity } from '../../../models/ManagedEntity.model';
import { ManagedEntityPublicSummary } from './hermesContext.contract';
import { redactText } from './contextRedaction.policy';

export const readManagedEntityContext = async ({
  businessSlug,
  managedEntityId,
}: {
  businessSlug: string;
  managedEntityId?: string;
}): Promise<ManagedEntityPublicSummary | undefined> => {
  if (!managedEntityId) return undefined;
  const entity: any = await ManagedEntity.findOne({ businessSlug, _id: managedEntityId }).lean().exec();
  if (!entity || entity.businessSlug !== businessSlug) return undefined;
  return {
    managedEntityId: String(entity._id),
    type: entity.type,
    displayName: redactText(entity.displayName || entity.name || entity.data?.plate),
    summary: redactText(entity.summary || entity.data?.summary || entity.displayName),
  };
};
