import { getMockState } from '../mockDemoTestStore';
import { assertTimelineResponse } from '../../contracts/timeline.contract';

const delay = (ms = 300) => new Promise(resolve => setTimeout(resolve, ms));

export async function mockGetTimeline(caseId, params) {
  await delay();

  const state = getMockState();
  const order = params?.order || 'newest-first';

  let events = state.timelineEvents.filter(evt => evt.caseId === caseId);

  // Default is newest-first, so sort descending by timestamp
  if (order === 'newest-first') {
    events.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  } else {
    // oldest-first
    events.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  }

  return assertTimelineResponse({
    ok: true,
    events
  });
}
