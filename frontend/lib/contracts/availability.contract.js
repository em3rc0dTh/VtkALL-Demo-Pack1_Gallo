/**
 * @typedef {Object} SlotOption
 * @property {string} startAt
 * @property {string} endAt
 * @property {number} capacityRemaining
 */

/**
 * @typedef {Object} AvailabilityResponse
 * @property {boolean} ok
 * @property {SlotOption[]} slots
 */

export function assertAvailabilityResponse(payload) {
  const availability = payload?.data || payload;
  const slots = availability?.slots;
  if (!payload || payload.ok !== true || !Array.isArray(slots)) {
    throw new TypeError("Invalid AvailabilityResponse");
  }
  return {
    ...payload,
    data: availability,
    availability,
    slots: slots.map((slot) => ({
      ...slot,
      capacityRemaining: slot.capacityRemaining ?? slot.availableCapacity ?? 0,
    })),
  };
}
