import { Router } from 'express';
import {
  createCase,
  createCustomer,
  createManagedEntityHandler,
  getAvailabilityHandler,
  listCaseTimeline,
  scheduleConsultation,
} from '../controllers/demoTest.controller';
import agentSimRoutes from './agentSim.routes';

const router = Router();

router.post('/customers', createCustomer);
router.post('/managed-entities', createManagedEntityHandler);
router.post('/cases', createCase);
router.get('/availability', getAvailabilityHandler);
router.post('/schedule-consultation', scheduleConsultation);
router.get('/cases/:caseId/timeline', listCaseTimeline);
router.use('/agent', agentSimRoutes);

export default router;

