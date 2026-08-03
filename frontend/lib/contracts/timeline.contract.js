/**
 * @typedef {Object} TimelineEvent
 * @property {string} _id
 * @property {string} eventType
 * @property {string} timestamp
 */

/**
 * @typedef {Object} TimelineResponse
 * @property {boolean} ok
 * @property {TimelineEvent[]} events
 */

export function assertTimelineResponse(payload) {
  const events = payload?.events || payload?.timeline;
  if (!payload || payload.ok !== true || !Array.isArray(events)) {
    throw new TypeError("Invalid TimelineResponse");
  }
  return {
    ...payload,
    events,
    timeline: events,
  };
}
