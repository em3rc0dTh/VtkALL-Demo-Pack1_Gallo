import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { env } from '../../config/env';

type EnvSource = 'process.env existing' | 'backend/.env' | 'code default';

const backendEnvPath = path.join(__dirname, '../../../.env');

const parseEnvFile = () => {
  if (!fs.existsSync(backendEnvPath)) return {};
  return dotenv.parse(fs.readFileSync(backendEnvPath));
};

const mask = (value?: string) => {
  if (!value) return undefined;
  if (value.length <= 4) return '*'.repeat(value.length);
  return `${value.slice(0, 2)}${'*'.repeat(Math.max(2, value.length - 4))}${value.slice(-2)}`;
};

const configuredEnv = parseEnvFile();

const determineSource = (): { variable: 'MONGO_URI'; source: EnvSource } => {
  if (process.env.MONGO_URI && configuredEnv.MONGO_URI !== process.env.MONGO_URI) {
    return { variable: 'MONGO_URI', source: 'process.env existing' };
  }
  if (configuredEnv.MONGO_URI) return { variable: 'MONGO_URI', source: 'backend/.env' };
  return { variable: 'MONGO_URI', source: 'code default' };
};

const parseMongoUri = (uri: string) => {
  const parsed = new URL(uri);
  const queryOptions = [...parsed.searchParams.keys()].sort();
  return {
    scheme: parsed.protocol.replace(':', ''),
    host: parsed.hostname,
    port: parsed.port ? Number(parsed.port) : undefined,
    database: parsed.pathname.replace(/^\//, '') || undefined,
    authSource: parsed.searchParams.get('authSource') || undefined,
    usernamePresent: Boolean(parsed.username),
    passwordPresent: Boolean(parsed.password),
    usernameLength: parsed.username ? decodeURIComponent(parsed.username).length : 0,
    passwordLength: parsed.password ? decodeURIComponent(parsed.password).length : 0,
    usernameMasked: mask(parsed.username ? decodeURIComponent(parsed.username) : undefined),
    queryOptions,
  };
};

const run = () => {
  const source = determineSource();
  let parsed: ReturnType<typeof parseMongoUri> | undefined;
  let parseError: string | undefined;
  try {
    parsed = parseMongoUri(env.mongoUri);
  } catch (error: any) {
    parseError = error?.message || 'Invalid Mongo URI.';
  }

  const report = {
    workingDirectory: process.cwd(),
    backendEnvPath,
    backendEnvExists: fs.existsSync(backendEnvPath),
    nodeEnv: env.nodeEnv,
    mongoUriSource: source.variable,
    source: source.source,
    uriPresent: Boolean(env.mongoUri),
    parseError,
    ...parsed,
    shellOverridePresent: Boolean(process.env.MONGO_URI && configuredEnv.MONGO_URI !== process.env.MONGO_URI),
    backendEnvDefinesMongoUri: Boolean(configuredEnv.MONGO_URI),
    codeDefaultWouldApply: !configuredEnv.MONGO_URI && !process.env.MONGO_URI,
  };

  console.log(JSON.stringify(report, null, 2));
  if (parseError) process.exit(1);
};

run();
