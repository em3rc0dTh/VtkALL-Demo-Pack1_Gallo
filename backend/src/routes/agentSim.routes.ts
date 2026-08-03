import { Router } from 'express';
import {
  cancel,
  customerData,
  requestSlots,
  selectService,
  selectSlot,
  message,
  openMessage,
  start,
  state,
} from '../controllers/agentSim.controller';

const router = Router();

router.post('/message', openMessage);
router.post('/schedule-consultation/start', start);
router.get('/workflows/:workflowId/state', state);
router.post('/workflows/:workflowId/select-service', selectService);
router.post('/workflows/:workflowId/customer-data', customerData);
router.post('/workflows/:workflowId/request-slots', requestSlots);
router.post('/workflows/:workflowId/select-slot', selectSlot);
router.post('/workflows/:workflowId/cancel', cancel);
router.post('/workflows/:workflowId/message', message);

export default router;
