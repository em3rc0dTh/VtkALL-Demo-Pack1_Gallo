import mongoose from 'mongoose';
import { env } from '../../../config/env';
import { BusinessProfile } from '../../../models/BusinessProfile.model';
import { Case } from '../../../models/Case.model';
import { CatalogOffering } from '../../../models/CatalogOffering.model';
import { Customer } from '../../../models/Customer.model';
import { CustomerInteraction } from '../../../models/CustomerInteraction.model';
import { ManagedEntity } from '../../../models/ManagedEntity.model';

export type TestResult = {
  name: string;
  passed: boolean;
  status: 'PASS' | 'FAIL';
  detail?: string;
};

export type CleanupCounts = Record<string, { created: number; removed: number }>;

export const assert = (condition: unknown, message: string) => {
  if (!condition) throw new Error(message);
};

export const runId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;

export const connectMongo = async () => {
  if (mongoose.connection.readyState === 1) return;
  await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 10000 });
  await CustomerInteraction.createIndexes();
};

export const disconnectMongo = async () => {
  if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
};

export const makeResult = async (name: string, fn: () => Promise<void>): Promise<TestResult> => {
  try {
    await fn();
    return { name, passed: true, status: 'PASS' };
  } catch (error: any) {
    return { name, passed: false, status: 'FAIL', detail: String(error?.message || error) };
  }
};

export const printSummary = (label: string, results: TestResult[], cleanup: CleanupCounts) => {
  const passed = results.filter((result) => result.passed).length;
  const summary = {
    label,
    ok: passed === results.length,
    total: results.length,
    passed,
    failed: results.length - passed,
    results,
    cleanup,
  };
  console.log(JSON.stringify(summary, null, 2));
  if (!summary.ok) process.exit(1);
};

export const cleanupRunFixtures = async (conversationId: string): Promise<CleanupCounts> => {
  const queries = {
    CustomerInteraction: { businessSlug: 'demo_test', conversationId },
    Customer: { businessSlug: 'demo_test', _id: new RegExp(`^${conversationId}`) },
    ManagedEntity: { businessSlug: 'demo_test', _id: new RegExp(`^${conversationId}`) },
    Case: { businessSlug: 'demo_test', _id: new RegExp(`^${conversationId}`) },
    CatalogOffering: { businessSlug: 'demo_test', _id: new RegExp(`^${conversationId}`) },
    BusinessProfile: { businessSlug: `${conversationId}-business` },
  };
  const before = {
    CustomerInteraction: await CustomerInteraction.countDocuments(queries.CustomerInteraction),
    Customer: await Customer.countDocuments(queries.Customer),
    ManagedEntity: await ManagedEntity.countDocuments(queries.ManagedEntity),
    Case: await Case.countDocuments(queries.Case),
    CatalogOffering: await CatalogOffering.countDocuments(queries.CatalogOffering),
    BusinessProfile: await BusinessProfile.countDocuments(queries.BusinessProfile),
  };
  const removed = {
    CustomerInteraction: (await CustomerInteraction.deleteMany(queries.CustomerInteraction)).deletedCount || 0,
    Customer: (await Customer.deleteMany(queries.Customer)).deletedCount || 0,
    ManagedEntity: (await ManagedEntity.deleteMany(queries.ManagedEntity)).deletedCount || 0,
    Case: (await Case.deleteMany(queries.Case)).deletedCount || 0,
    CatalogOffering: (await CatalogOffering.deleteMany(queries.CatalogOffering)).deletedCount || 0,
    BusinessProfile: (await BusinessProfile.deleteMany(queries.BusinessProfile)).deletedCount || 0,
  };
  return Object.fromEntries(Object.keys(before).map((key) => [
    key,
    { created: before[key as keyof typeof before], removed: removed[key as keyof typeof removed] },
  ]));
};

