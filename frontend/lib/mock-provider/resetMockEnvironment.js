import { resetMockStore } from './mockDemoTestStore';
import { resetMockIds } from './mockDemoTestIds';
import { resetMockClock } from './mockDemoTestClock';
import { resetMockScenario } from './mockScenarioController';

export function resetMockEnvironment() {
  resetMockStore();
  resetMockIds();
  resetMockClock();
  resetMockScenario();
}
