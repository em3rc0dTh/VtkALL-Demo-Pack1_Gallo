import { turaguaConfig } from './turagua.js';
import { bateylateConfig } from './bateylate.js';
import { repairDemoConfig } from './repairDemo.js';

export const defaultBusinessSlug = 'turagua';

export const verticalConfigs = Object.freeze({
  turagua: turaguaConfig,
  bateylate: bateylateConfig,
  'repair-demo': repairDemoConfig
});

export const businessToVertical = Object.freeze(
  Object.fromEntries(
    Object.entries(verticalConfigs).map(([businessSlug, config]) => [businessSlug, config.vertical])
  )
);

export const supportedVerticals = Object.freeze(
  [...new Set(Object.values(verticalConfigs).map((config) => config.vertical))]
);
