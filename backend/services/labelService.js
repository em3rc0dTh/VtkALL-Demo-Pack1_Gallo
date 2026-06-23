import { getActiveVerticalConfig } from './verticalConfigService.js';

export const getLabels = () => getActiveVerticalConfig().labels;

export const getLabel = (key, fallback = key) => {
  const labels = getLabels();
  return labels?.[key] || fallback;
};

export const formatEntityLabel = (key, count = 1) => {
  const labels = getLabels();
  const pluralKeyCandidates = [
    `${key}s`,
    key.endsWith('Entity') ? `${key.slice(0, -'Entity'.length)}Entities` : null
  ].filter(Boolean);
  const label = Number(count) === 1
    ? labels?.[key]
    : pluralKeyCandidates.map((candidate) => labels?.[candidate]).find(Boolean) || labels?.[key];

  return label || key;
};
