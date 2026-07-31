import { apiDemoTestRepository } from './apiDemoTestRepository';
import { mockDemoTestRepository } from './mockDemoTestRepository';
import { setMockScenario } from '../mock-provider/mockScenarioController';
import { requireDemoTestDataMode } from '../config/demoTestDataMode';

const selectDemoTestRepository = () => {
  const mode = requireDemoTestDataMode();
  return mode === 'api'
    ? apiDemoTestRepository
    : mockDemoTestRepository;
};

export const demoTestRepository = {
  createCustomer: (payload) => selectDemoTestRepository().createCustomer(payload),
  createManagedEntity: (payload) => selectDemoTestRepository().createManagedEntity(payload),
  createCase: (payload) => selectDemoTestRepository().createCase(payload),
  getAvailability: (params) => selectDemoTestRepository().getAvailability(params),
  scheduleConsultation: (payload) => selectDemoTestRepository().scheduleConsultation(payload),
  getTimeline: (caseId, params) => selectDemoTestRepository().getTimeline(caseId, params),
};

// Expose setMockScenario for local testing directly from UI console
export { setMockScenario };
