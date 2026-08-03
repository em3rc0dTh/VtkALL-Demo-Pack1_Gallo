import { mockCreateCustomer } from '../mock-provider/operations/createCustomer.mock';
import { mockCreateManagedEntity } from '../mock-provider/operations/createManagedEntity.mock';
import { mockCreateCase } from '../mock-provider/operations/createCase.mock';
import { mockGetAvailability } from '../mock-provider/operations/getAvailability.mock';
import { mockScheduleConsultation } from '../mock-provider/operations/scheduleConsultation.mock';
import { mockGetTimeline } from '../mock-provider/operations/getTimeline.mock';

export const mockDemoTestRepository = {
  createCustomer: mockCreateCustomer,
  createManagedEntity: mockCreateManagedEntity,
  createCase: mockCreateCase,
  getAvailability: mockGetAvailability,
  scheduleConsultation: mockScheduleConsultation,
  getTimeline: mockGetTimeline,
};
