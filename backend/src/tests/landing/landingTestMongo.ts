import { env } from '../../config/env';

const normalizeDatabaseName = (value = '') => String(value || '').replace(/^\/+|\/+$/g, '').trim();

const deriveLandingTestMongoUri = (sourceUri: string) => {
  let parsed: URL;
  try {
    parsed = new URL(sourceUri);
  } catch {
    throw new Error('Invalid MONGO_URI. Configure a valid MongoDB connection string before running Landing integration tests.');
  }

  const sourceDatabase = normalizeDatabaseName(parsed.pathname) || 'vtkall_demo_pack_1';
  const requestedTestDatabase = normalizeDatabaseName(process.env.MONGO_TEST_DATABASE || `${sourceDatabase}_landing_test`);

  if (!parsed.username && process.env.MONGO_INITDB_ROOT_USERNAME) {
    parsed.username = process.env.MONGO_INITDB_ROOT_USERNAME;
  }
  if (!parsed.password && process.env.MONGO_INITDB_ROOT_PASSWORD) {
    parsed.password = process.env.MONGO_INITDB_ROOT_PASSWORD;
  }
  if (parsed.username && !parsed.searchParams.has('authSource')) {
    parsed.searchParams.set('authSource', 'admin');
  }

  parsed.pathname = `/${requestedTestDatabase}`;
  return parsed.toString();
};

export const landingTestMongoUri = process.env.MONGO_TEST_URI || deriveLandingTestMongoUri(env.mongoUri);

export const assertDedicatedLandingTestDatabase = () => {
  const source = new URL(env.mongoUri);
  const target = new URL(landingTestMongoUri);
  const sourceDatabase = normalizeDatabaseName(source.pathname);
  const targetDatabase = normalizeDatabaseName(target.pathname);

  if (!targetDatabase || targetDatabase === sourceDatabase) {
    throw new Error(
      'Landing integration tests require a dedicated Mongo database. Set MONGO_TEST_URI or MONGO_TEST_DATABASE to a database different from MONGO_URI.'
    );
  }

  return targetDatabase;
};
