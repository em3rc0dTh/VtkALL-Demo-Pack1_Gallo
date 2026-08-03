import { configuredOllamaKeepAlive, configuredOllamaModel, ollamaBaseUrl } from '../model/hermesInferenceRuntime.service';

type Rule = {
  name: string;
  value: string | undefined;
  defaultValue: string;
  required?: boolean;
  validate: (value: string) => boolean;
  message: string;
};

const positiveNumber = (value: string) => Number.isFinite(Number(value)) && Number(value) > 0;
const zeroOrPositiveNumber = (value: string) => Number.isFinite(Number(value)) && Number(value) >= 0;
const integerAtLeast = (min: number) => (value: string) => Number.isInteger(Number(value)) && Number(value) >= min;
const keepAliveFormat = (value: string) => /^(\d+(ms|s|m|h)|-1|0)$/.test(value);

const isUrl = (value: string) => {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

const ruleValue = (rule: Rule) => rule.value ?? rule.defaultValue;

const rules = (): Rule[] => [
  {
    name: 'OLLAMA_URL',
    value: ollamaBaseUrl(),
    defaultValue: 'http://ollama:11434',
    validate: isUrl,
    message: 'must be an http(s) URL',
  },
  {
    name: 'HERMES_CONVERSATIONAL_OLLAMA_MODEL',
    value: configuredOllamaModel(),
    defaultValue: 'qwen2.5:0.5b',
    validate: (value) => value.trim().length > 0,
    message: 'must not be empty',
  },
  {
    name: 'HERMES_MODEL_INTERPRETATION_TIMEOUT_MS',
    value: process.env.HERMES_MODEL_INTERPRETATION_TIMEOUT_MS,
    defaultValue: '15000',
    validate: positiveNumber,
    message: 'must be > 0',
  },
  {
    name: 'HERMES_MODEL_COMPOSITION_TIMEOUT_MS',
    value: process.env.HERMES_MODEL_COMPOSITION_TIMEOUT_MS,
    defaultValue: '10000',
    validate: positiveNumber,
    message: 'must be > 0',
  },
  {
    name: 'HERMES_MODEL_OLLAMA_NUM_PREDICT',
    value: process.env.HERMES_MODEL_OLLAMA_NUM_PREDICT,
    defaultValue: '256',
    validate: positiveNumber,
    message: 'must be > 0 when defined',
  },
  {
    name: 'HERMES_MODEL_OLLAMA_NUM_CTX',
    value: process.env.HERMES_MODEL_OLLAMA_NUM_CTX,
    defaultValue: '',
    validate: (value) => value === '' || positiveNumber(value),
    message: 'must be empty/default or > 0',
  },
  {
    name: 'HERMES_MODEL_CIRCUIT_FAILURE_THRESHOLD',
    value: process.env.HERMES_MODEL_CIRCUIT_FAILURE_THRESHOLD,
    defaultValue: '3',
    validate: integerAtLeast(1),
    message: 'must be an integer >= 1',
  },
  {
    name: 'HERMES_MODEL_CIRCUIT_COOLDOWN_MS',
    value: process.env.HERMES_MODEL_CIRCUIT_COOLDOWN_MS,
    defaultValue: '30000',
    validate: positiveNumber,
    message: 'must be > 0',
  },
  {
    name: 'HERMES_MODEL_MAX_CONCURRENT',
    value: process.env.HERMES_MODEL_MAX_CONCURRENT,
    defaultValue: '1',
    validate: integerAtLeast(1),
    message: 'must be an integer >= 1',
  },
  {
    name: 'HERMES_MODEL_MAX_QUEUE',
    value: process.env.HERMES_MODEL_MAX_QUEUE,
    defaultValue: '4',
    validate: zeroOrPositiveNumber,
    message: 'must be >= 0',
  },
  {
    name: 'HERMES_MODEL_QUEUE_WAIT_MS',
    value: process.env.HERMES_MODEL_QUEUE_WAIT_MS,
    defaultValue: '2000',
    validate: zeroOrPositiveNumber,
    message: 'must be >= 0',
  },
  {
    name: 'HERMES_OLLAMA_WARMUP_TIMEOUT_MS',
    value: process.env.HERMES_OLLAMA_WARMUP_TIMEOUT_MS,
    defaultValue: '20000',
    validate: positiveNumber,
    message: 'must be > 0',
  },
  {
    name: 'HERMES_OLLAMA_KEEP_ALIVE',
    value: configuredOllamaKeepAlive(),
    defaultValue: '30m',
    validate: keepAliveFormat,
    message: 'must use Ollama keep_alive format such as 30m, 10s, 1h, 0, or -1',
  },
  ...[
    ['HERMES_CONTEXT_MAX_HISTORY_MESSAGES', '8', zeroOrPositiveNumber, 'must be >= 0'],
    ['HERMES_CONTEXT_MAX_MEMORY_FACTS', '8', zeroOrPositiveNumber, 'must be >= 0'],
    ['HERMES_CONTEXT_MAX_CATALOG_OFFERINGS', '5', zeroOrPositiveNumber, 'must be >= 0'],
    ['HERMES_CONTEXT_MAX_OFFERING_DESCRIPTION_CHARS', '220', zeroOrPositiveNumber, 'must be >= 0'],
    ['HERMES_CONTEXT_MAX_INTERPRETATION_CHARS', '12000', positiveNumber, 'must be > 0'],
    ['HERMES_CONTEXT_MAX_COMPOSITION_CHARS', '9000', positiveNumber, 'must be > 0'],
  ].map(([name, defaultValue, validate, message]) => ({
    name: String(name),
    value: process.env[String(name)],
    defaultValue: String(defaultValue),
    validate: validate as (value: string) => boolean,
    message: String(message),
  })),
];

export const validateHermesOperationalConfig = () => {
  const errors = rules()
    .filter((rule) => !rule.validate(ruleValue(rule)))
    .map((rule) => ({ variable: rule.name, reason: rule.message }));

  if (errors.length) {
    console.error('[hermes-operational-config] invalid', { errors });
    throw new Error(`Invalid Hermes operational configuration: ${errors.map((error) => error.variable).join(', ')}`);
  }

  console.log('[hermes-operational-config] valid', {
    variablesChecked: rules().length,
    ollamaModel: configuredOllamaModel(),
  });
};

