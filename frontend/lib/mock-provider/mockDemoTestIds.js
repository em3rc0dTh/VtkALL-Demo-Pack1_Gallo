let counters = {};

export function nextMockId(prefix) {
  if (!counters[prefix]) {
    counters[prefix] = 1;
  }
  const id = `${prefix}_mock_${counters[prefix].toString().padStart(3, '0')}`;
  counters[prefix]++;
  return id;
}

export function resetMockIds() {
  counters = {};
}
