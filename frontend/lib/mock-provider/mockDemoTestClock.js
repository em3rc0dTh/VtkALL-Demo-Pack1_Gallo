let simulatedTimeOffset = 0; // In milliseconds

export function nowMockIso() {
  const time = new Date(Date.now() + simulatedTimeOffset);
  return time.toISOString();
}

export function advanceMockClock(milliseconds) {
  simulatedTimeOffset += milliseconds;
}

export function resetMockClock() {
  simulatedTimeOffset = 0;
}
