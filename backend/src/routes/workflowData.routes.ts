import { Router } from 'express';
import {
  getAvailability,
  getCatalog,
  getCatalogRequiredFields,
  postCustomerContext,
  postReserveAppointment,
} from '../controllers/workflowData.controller';

const router = Router();

router.get('/catalog', getCatalog);
router.get('/catalog/:id/required-fields', getCatalogRequiredFields);
router.get('/availability', getAvailability);
router.post('/customer-context', postCustomerContext);
router.post('/appointments/reserve', postReserveAppointment);

export default router;
