import { BusinessProfile } from '../models/BusinessProfile.model';

export const findBusinessProfileBySlug = (businessSlug: string) =>
  BusinessProfile.findOne({ businessSlug, active: true });

export const updateBusinessProfileBySlug = (businessSlug: string, expectedVersion: number, patch: any) =>
  BusinessProfile.findOneAndUpdate(
    {
      businessSlug,
      active: true,
      ...(expectedVersion === 0
        ? { $or: [{ settingsVersion: 0 }, { settingsVersion: { $exists: false } }] }
        : { settingsVersion: expectedVersion }),
    },
    { $set: patch, $inc: { settingsVersion: 1 } },
    { new: true }
  );
